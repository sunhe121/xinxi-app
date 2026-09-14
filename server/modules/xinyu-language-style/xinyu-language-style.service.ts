import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and } from 'drizzle-orm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { xinyuLanguageSamples, xinyuUsers } from '@server/database/schema.plain';
import type {
  AnalyzeLanguageStyleResponse,
  CreateLanguageSampleRequest,
  LanguageSample,
  UpdateLanguageSampleRequest,
} from '@shared/api.interface';

@Injectable()
export class XinyuLanguageStyleService {
  private readonly logger = new Logger(XinyuLanguageStyleService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.baseUrl = this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
    this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
  }

  private get isAiConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async getSamples(userId: string): Promise<LanguageSample[]> {
    const rows = await this.db
      .select()
      .from(xinyuLanguageSamples)
      .where(eq(xinyuLanguageSamples.userId, userId))
      .orderBy(xinyuLanguageSamples.createdAt);
    return rows.map((row) => this.mapSampleRow(row));
  }

  async createSample(
    userId: string,
    dto: CreateLanguageSampleRequest,
  ): Promise<LanguageSample> {
    const inserted = await this.db
      .insert(xinyuLanguageSamples)
      .values({
        userId,
        category: dto.category,
        title: dto.title,
        transcript: dto.transcript,
        audioUrl: dto.audioUrl,
        duration: dto.duration ?? 0,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();
    return this.mapSampleRow(inserted[0]);
  }

  async updateSample(
    userId: string,
    id: string,
    dto: UpdateLanguageSampleRequest,
  ): Promise<LanguageSample> {
    const patch: Partial<typeof xinyuLanguageSamples.$inferInsert> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.transcript !== undefined) patch.transcript = dto.transcript;
    if (dto.audioUrl !== undefined) patch.audioUrl = dto.audioUrl;
    if (dto.duration !== undefined) patch.duration = dto.duration;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    patch.updatedAt = new Date();
    patch.updatedBy = userId;

    const updated = await this.db
      .update(xinyuLanguageSamples)
      .set(patch)
      .where(and(eq(xinyuLanguageSamples.id, id), eq(xinyuLanguageSamples.userId, userId)))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('语言样本不存在');
    }
    return this.mapSampleRow(updated[0]);
  }

  async deleteSample(userId: string, id: string): Promise<void> {
    const deleted = await this.db
      .delete(xinyuLanguageSamples)
      .where(and(eq(xinyuLanguageSamples.id, id), eq(xinyuLanguageSamples.userId, userId)))
      .returning({ id: xinyuLanguageSamples.id });

    if (deleted.length === 0) {
      throw new NotFoundException('语言样本不存在');
    }
  }

  async analyzeLanguageStyle(userId: string): Promise<AnalyzeLanguageStyleResponse> {
    const samples = await this.db
      .select({ transcript: xinyuLanguageSamples.transcript })
      .from(xinyuLanguageSamples)
      .where(eq(xinyuLanguageSamples.userId, userId));

    if (samples.length < 3) {
      throw new BadRequestException('至少需要3段语音样本');
    }

    const transcripts: string[] = samples.map((s) => s.transcript);
    const result = this.isAiConfigured
      ? await this.callAiAnalysis(transcripts)
      : this.generateFallbackProfile(transcripts);

    const profileJson = JSON.stringify(result);
    await this.db
      .update(xinyuUsers)
      .set({
        languageProfile: profileJson,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(xinyuUsers.userId, userId));

    return result;
  }

  async getProfile(userId: string): Promise<AnalyzeLanguageStyleResponse> {
    const rows = await this.db
      .select({ languageProfile: xinyuUsers.languageProfile })
      .from(xinyuUsers)
      .where(eq(xinyuUsers.userId, userId))
      .limit(1);

    if (rows.length === 0 || !rows[0].languageProfile) {
      return { profile: '', keywords: [], tone: '' };
    }

    try {
      const parsed = JSON.parse(rows[0].languageProfile) as AnalyzeLanguageStyleResponse;
      return {
        profile: parsed.profile ?? '',
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        tone: parsed.tone ?? '',
      };
    } catch {
      return { profile: '', keywords: [], tone: '' };
    }
  }

  private async callAiAnalysis(transcripts: string[]): Promise<AnalyzeLanguageStyleResponse> {
    const samplesText = transcripts
      .map((t: string, i: number) => `---样本${i + 1}---\n${t}`)
      .join('\n\n');

    const prompt = `
你是一位语言风格分析专家。请分析以下文本样本，提炼说话人的语言风格特点。

【文本样本】
${samplesText}

请按以下JSON格式返回：
{
  "profile": "整体风格描述，100字以内",
  "keywords": ["常用词汇1", "常用词汇2", "常用词汇3", "常用词汇4", "常用词汇5"],
  "tone": "语气特点描述，50字以内"
}
`.trim();

    try {
      const response = await axios.post(
        `${this.baseUrl.replace(/\/$/, '')}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '你是一位专业的语言风格分析专家，用中文分析文本并输出结构化JSON。',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 300,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        },
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (content && typeof content === 'string') {
        const parsed = JSON.parse(content) as AnalyzeLanguageStyleResponse;
        return {
          profile: parsed.profile ?? '',
          keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
          tone: parsed.tone ?? '',
        };
      }
      throw new Error('AI返回内容为空');
    } catch (error) {
      this.logger.error('AI语言风格分析失败，使用兜底生成', error as Error);
      return this.generateFallbackProfile(transcripts);
    }
  }

  private generateFallbackProfile(transcripts: string[]): AnalyzeLanguageStyleResponse {
    const allText = transcripts.join('');
    const sampleCount = transcripts.length;

    const careWords = ['保重', '注意', '记得', '别忘', '身体', '健康', '按时', '早点', '休息', '保暖'];
    const warmWords = ['想你', '爱你', '关心', '温暖', '亲', '亲爱的', '宝贝', '乖'];
    const dailyWords = ['今天', '明天', '昨天', '吃饭', '睡觉', '上班', '下班', '回家'];

    let careCount = 0;
    let warmCount = 0;
    let dailyCount = 0;

    for (const word of careWords) {
      if (allText.includes(word)) careCount += 1;
    }
    for (const word of warmWords) {
      if (allText.includes(word)) warmCount += 1;
    }
    for (const word of dailyWords) {
      if (allText.includes(word)) dailyCount += 1;
    }

    const hasCare = careCount >= 2;
    const hasWarm = warmCount >= 1;
    const hasDaily = dailyCount >= 2;

    let profile = '温暖亲切，关心家人健康，说话朴实真诚';
    let tone = '语气温和，充满关怀';
    const keywords: string[] = [];

    if (hasCare && hasWarm) {
      profile = '温暖体贴，善于关心家人生活细节，说话亲切自然，充满爱意';
      tone = '温柔关切，贴心周到';
      keywords.push('关心体贴', '温暖', '亲切', '朴实', '关怀备至');
    } else if (hasCare) {
      profile = '朴实真诚，经常叮嘱家人注意身体和生活，话不多但充满关心';
      tone = '平实恳切，实在贴心';
      keywords.push('朴实真诚', '叮嘱', '关心健康', '实在', '贴心');
    } else if (hasWarm) {
      profile = '温柔细腻，善于表达情感，说话温暖有爱，让人感到被重视';
      tone = '温柔深情，充满爱意';
      keywords.push('温柔', '表达情感', '温暖', '细腻', '有爱');
    } else if (hasDaily) {
      profile = '平实自然，日常交流为主，话题贴近生活，说话接地气';
      tone = '平实自然，亲切随和';
      keywords.push('平实', '生活化', '自然', '接地气', '随和');
    } else {
      keywords.push('朴实', '真诚', '自然', '亲切', '温暖');
    }

    if (sampleCount >= 5) {
      profile += `，样本丰富（${sampleCount}段），风格画像较为准确`;
    }

    return { profile, keywords, tone };
  }

  private mapSampleRow(row: typeof xinyuLanguageSamples.$inferSelect): LanguageSample {
    return {
      id: row.id,
      userId: row.userId,
      category: row.category as LanguageSample['category'],
      title: row.title,
      transcript: row.transcript,
      audioUrl: row.audioUrl ?? undefined,
      duration: row.duration ?? 0,
      createdAt: row.createdAt ? row.createdAt.toISOString() : '',
    };
  }
}
