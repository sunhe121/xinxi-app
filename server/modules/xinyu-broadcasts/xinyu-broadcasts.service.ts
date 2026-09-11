import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { xinyuBroadcasts } from '@server/database/schema';
import { eq, desc, count, and } from 'drizzle-orm';
import type {
  Broadcast,
  BroadcastDirection,
  FamilyRelation,
  GenerateBroadcastResponse,
  ToneStyle,
  WeatherInfo,
} from '@shared/api.interface';
import { AiService } from '../ai/ai.service';
import { XinyuDailyDataService } from '../xinyu-daily-data/xinyu-daily-data.service';
import { XinyuWeatherService } from '../xinyu-weather/xinyu-weather.service';
import { XinyuUsersService } from '../xinyu-users/xinyu-users.service';

@Injectable()
export class XinyuBroadcastsService {
  private readonly logger = new Logger(XinyuBroadcastsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly aiService: AiService,
    private readonly dailyDataService: XinyuDailyDataService,
    private readonly weatherService: XinyuWeatherService,
    private readonly usersService: XinyuUsersService,
  ) {}

  async getInbox(
    userId: string,
    page: number,
    pageSize: number,
    targetUserId?: string,
  ): Promise<{ items: Broadcast[]; total: number; page: number; pageSize: number }> {
    const offset = (page - 1) * pageSize;
    const whereConditions = [
      eq(xinyuBroadcasts.targetUserId, userId),
      eq(xinyuBroadcasts.direction, 'from_partner'),
    ];
    if (targetUserId) {
      whereConditions.push(eq(xinyuBroadcasts.userId, targetUserId));
    }
    const [rows, countResult] = await Promise.all([
      this.db
        .select()
        .from(xinyuBroadcasts)
        .where(and(...whereConditions))
        .orderBy(desc(xinyuBroadcasts.broadcastDate), desc(xinyuBroadcasts.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(xinyuBroadcasts)
        .where(and(...whereConditions)),
    ]);

    return {
      items: rows.map((r) => this.mapRow(r)),
      total: Number(countResult[0]?.count ?? 0),
      page,
      pageSize,
    };
  }

  async getList(
    userId: string,
    page: number,
    pageSize: number,
    targetUserId?: string,
  ): Promise<{ items: Broadcast[]; total: number; page: number; pageSize: number }> {
    const offset = (page - 1) * pageSize;
    const whereConditions = [eq(xinyuBroadcasts.userId, userId)];
    if (targetUserId) {
      whereConditions.push(eq(xinyuBroadcasts.targetUserId, targetUserId));
    }
    const [rows, countResult] = await Promise.all([
      this.db
        .select()
        .from(xinyuBroadcasts)
        .where(and(...whereConditions))
        .orderBy(desc(xinyuBroadcasts.broadcastDate))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(xinyuBroadcasts)
        .where(and(...whereConditions)),
    ]);

    return {
      items: rows.map((r) => this.mapRow(r)),
      total: Number(countResult[0]?.count ?? 0),
      page,
      pageSize,
    };
  }

  async getById(id: string, userId: string): Promise<Broadcast> {
    const rows = await this.db
      .select()
      .from(xinyuBroadcasts)
      .where(eq(xinyuBroadcasts.id, id))
      .limit(1);
    if (rows.length === 0) throw new NotFoundException('播报不存在');
    const broadcast = rows[0];
    if (broadcast.userId !== userId && broadcast.targetUserId !== userId) {
      throw new NotFoundException('播报不存在');
    }
    return this.mapRow(broadcast);
  }

  async getLatestFromPartner(userId: string, partnerUserId: string): Promise<Broadcast | null> {
    const rows = await this.db
      .select()
      .from(xinyuBroadcasts)
      .where(
        and(
          eq(xinyuBroadcasts.targetUserId, userId),
          eq(xinyuBroadcasts.direction, 'from_partner'),
          eq(xinyuBroadcasts.userId, partnerUserId),
        ),
      )
      .orderBy(desc(xinyuBroadcasts.broadcastDate), desc(xinyuBroadcasts.createdAt))
      .limit(1);
    if (rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  async markAsRead(broadcastId: string, userId: string): Promise<Broadcast> {
    const updated = await this.db
      .update(xinyuBroadcasts)
      .set({ isRead: true })
      .where(
        and(
          eq(xinyuBroadcasts.id, broadcastId),
          eq(xinyuBroadcasts.targetUserId, userId),
        ),
      )
      .returning();
    if (updated.length === 0) throw new NotFoundException('播报不存在');
    return this.mapRow(updated[0]);
  }

  async replyToBroadcast(
    broadcastId: string,
    userId: string,
    content: string,
    audioUrl?: string,
  ): Promise<Broadcast> {
    const patch: Partial<typeof xinyuBroadcasts.$inferInsert> = {
      replyContent: content,
    };
    if (audioUrl !== undefined) {
      patch.replyAudioUrl = audioUrl;
    }
    const updated = await this.db
      .update(xinyuBroadcasts)
      .set(patch)
      .where(
        and(
          eq(xinyuBroadcasts.id, broadcastId),
          eq(xinyuBroadcasts.targetUserId, userId),
        ),
      )
      .returning();
    if (updated.length === 0) throw new NotFoundException('播报不存在');
    return this.mapRow(updated[0]);
  }

  async generate(
    userId: string,
    targetUserId: string,
    relation?: FamilyRelation,
    direction: BroadcastDirection = 'to_partner',
    toneStyle: ToneStyle = 'warm_chatter',
  ): Promise<GenerateBroadcastResponse> {
    const targetUser = await this.usersService.findByUserId(targetUserId);
    if (!targetUser) throw new BadRequestException('目标用户不存在');

    const senderUser = direction === 'from_partner'
      ? await this.usersService.findByUserId(userId)
      : null;

    const [dailyData, weatherInfo] = await Promise.all([
      this.dailyDataService.getTodayData(targetUserId, targetUser.role),
      this.weatherService.getWeather(targetUser.city),
    ]);

    const dailyDataStr = JSON.stringify(dailyData);
    const relationStr = relation || '家人';
    const relationLabel = this.getRelationLabel(relation);
    const addressTitle = targetUser.myTitle || relationLabel;
    const senderTitle = senderUser?.myTitle || '';

    let content = '';
    try {
      content = await this.aiService.generateBroadcast({
        dailyData: dailyDataStr as unknown as Record<string, unknown>,
        weatherInfo,
        relation: addressTitle,
        senderTitle,
        toneStyle,
        direction,
      });
    } catch (error) {
      this.logger.error('AI播报生成失败', error as Error);
      content = this.generateFallbackBroadcast(targetUser.nickname, dailyData.moodIndex, weatherInfo, addressTitle, toneStyle);
    }

    if (!content) {
      content = this.generateFallbackBroadcast(targetUser.nickname, dailyData.moodIndex, weatherInfo, addressTitle, toneStyle);
    }

    const summary = content.slice(0, 100);

    let broadcastId = '';
    try {
      const inserted = await this.db.insert(xinyuBroadcasts).values({
        userId,
        targetUserId,
        content,
        summary,
        broadcastDate: new Date().toISOString().split('T')[0],
        moodIndex: dailyData.moodIndex,
        steps: dailyData.steps,
        sleepHours: String(dailyData.sleepHours),
        weatherInfo: weatherInfo as unknown as Record<string, unknown>,
        status: 'generated',
        direction,
        toneStyle,
      }).returning({ id: xinyuBroadcasts.id });
      broadcastId = inserted[0]?.id ?? '';
    } catch (error) {
      this.logger.error('保存播报失败', error as Error);
    }

    return { content, summary, broadcastId };
  }

  private getTonePrompt(toneStyle: ToneStyle): string {
    const prompts: Record<ToneStyle, string> = {
      warm_chatter: '语气温暖唠叨，话多贴心，像家人一样嘘寒问暖，多一些关心的细节',
      warm_concise: '语气简洁实在，不多说废话，直接表达关心，真诚朴实',
      humorous: '语气幽默风趣，带点玩笑，轻松愉快，让人听了会心一笑',
      gentle: '语气温柔细腻，深情款款，充满爱意和温暖',
    };
    return prompts[toneStyle];
  }

  private generateFallbackBroadcast(
    name: string,
    moodIndex: number,
    weather: WeatherInfo,
    relationLabel: string,
    toneStyle: ToneStyle,
  ): string {
    const moodWord = moodIndex >= 8 ? '心情不错' : moodIndex >= 6 ? '心情还好' : '心情一般';
    const greeting = relationLabel === '爸爸' || relationLabel === '妈妈'
      ? `${relationLabel}，您今天身体还好吧？`
      : relationLabel === '儿子' || relationLabel === '女儿'
      ? `${name}，最近过得怎么样？`
      : `亲爱的${name}，`;

    const toneSuffix = this.getToneSuffix(toneStyle);
    return `${greeting}今天${weather.weather}，气温${weather.tempLow}到${weather.tempHigh}度。今天他${moodWord}，过得挺充实的。${toneSuffix}`;
  }

  private getToneSuffix(toneStyle: ToneStyle): string {
    const suffixes: Record<ToneStyle, string> = {
      warm_chatter: '记得按时吃饭，天冷加衣，照顾好自己哦。想你了，有时间多打电话回家。',
      warm_concise: '记得常联系，关心要及时说出口。',
      humorous: '生活就像一盒巧克力，你永远不知道下一颗是什么味道，但每天都要开心呀！',
      gentle: '愿你每一天都被温柔以待，心中有爱，眼里有光。想你。',
    };
    return suffixes[toneStyle];
  }

  private getRelationLabel(relation?: FamilyRelation): string {
    const labels: Record<FamilyRelation, string> = {
      father: '爸爸',
      mother: '妈妈',
      son: '儿子',
      daughter: '女儿',
      grandfather: '爷爷',
      grandmother: '奶奶',
      spouse: '亲爱的',
      other: '家人',
    };
    return relation ? labels[relation] : '家人';
  }

  private mapRow(row: typeof xinyuBroadcasts.$inferSelect): Broadcast {
    const weatherInfo = (row.weatherInfo ?? {}) as WeatherInfo;
    return {
      id: row.id,
      userId: row.userId,
      targetUserId: row.targetUserId,
      content: row.content,
      summary: row.summary ?? '',
      broadcastDate: String(row.broadcastDate),
      moodIndex: row.moodIndex ?? 7,
      steps: row.steps ?? 0,
      sleepHours: Number(row.sleepHours ?? 0),
      weatherInfo,
      status: row.status as Broadcast['status'],
      direction: row.direction as BroadcastDirection,
      toneStyle: row.toneStyle as ToneStyle,
      isRead: row.isRead,
      replyContent: row.replyContent ?? undefined,
      replyAudioUrl: row.replyAudioUrl ?? undefined,
      createdAt: row.createdAt?.toISOString() ?? '',
    };
  }
}
