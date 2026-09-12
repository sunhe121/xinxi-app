import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, sql } from 'drizzle-orm';
import { xinyuBindings, xinyuMessages, xinyuBroadcasts, xinyuUsers } from '@server/database/schema';
import { AiService } from '../ai/ai.service';
import type { MessageType } from '@shared/api.interface';

interface DailyMessageStats {
  textCount: number;
  voiceCount: number;
  imageCount: number;
  videoCount: number;
  textContents: string[];
  voiceContents: string[];
}

@Injectable()
export class XinyuReportService implements OnModuleInit {
  private readonly logger = new Logger(XinyuReportService.name);
  private lastReportDate = '';
  private checkTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly aiService: AiService,
  ) {}

  onModuleInit(): void {
    try {
      this.startScheduler();
    } catch (error) {
      this.logger.error(
        `报告定时任务初始化失败: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  private startScheduler(): void {
    const cronExpr = process.env.REPORT_TIME || '0 20 * * *';
    this.logger.log(`报告定时任务已启动，cron: ${cronExpr}（使用 setInterval 轮询实现，每30分钟检查）`);

    // 每 30 分钟检查一次，确保每天只执行一次
    this.checkTimer = setInterval(() => {
      this.checkAndRunReport().catch((err) => {
        this.logger.error(
          `定时报告检查异常: ${err.message}`,
          err.stack,
        );
      });
    }, 30 * 60 * 1000);

    setTimeout(() => {
      this.checkAndRunReport().catch((err) => {
        this.logger.error(
          `启动时报告检查异常: ${err.message}`,
          err.stack,
        );
      });
    }, 5000);
  }

  private async checkAndRunReport(): Promise<void> {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const hour = now.getHours();

      // 默认 20 点执行，支持 REPORT_HOUR 环境变量覆盖
      const targetHour = parseInt(process.env.REPORT_HOUR || '20', 10);

      // 同一天只执行一次，且必须已过目标小时
      if (this.lastReportDate === today) return;
      if (hour < targetHour) return;

      this.lastReportDate = today;
      this.logger.log(`开始生成每日报告，日期: ${today}`);
      await this.generateDailyReports(today);
      this.logger.log('每日报告生成完成');
    } catch (error) {
      this.logger.error(`每日报告生成失败: ${(error as Error).message}`, (error as Error).stack);
    }
  }

  async generateDailyReports(reportDate: string): Promise<number> {
    const bindings = await this.db
      .select()
      .from(xinyuBindings)
      .where(eq(xinyuBindings.status, 'bound'));

    if (bindings.length === 0) return 0;

    let generatedCount = 0;

    for (const binding of bindings) {
      // A -> B 方向
      const aToB = await this.generateOneDirection(
        binding.id,
        binding.userIdA,
        binding.userIdB,
        reportDate,
      );
      if (aToB) generatedCount += 1;

      // B -> A 方向
      const bToA = await this.generateOneDirection(
        binding.id,
        binding.userIdB,
        binding.userIdA,
        reportDate,
      );
      if (bToA) generatedCount += 1;
    }

    return generatedCount;
  }

  private async generateOneDirection(
    bindingId: string,
    senderUserId: string,
    receiverUserId: string,
    reportDate: string,
  ): Promise<boolean> {
    const startIso = `${reportDate}T00:00:00.000Z`;
    const endIso = `${reportDate}T23:59:59.999Z`;

    const messages = await this.db
      .select()
      .from(xinyuMessages)
      .where(
        and(
          eq(xinyuMessages.bindingId, bindingId),
          eq(xinyuMessages.senderUserId, senderUserId),
          eq(xinyuMessages.receiverUserId, receiverUserId),
          eq(xinyuMessages.isReported, false),
          sql`${xinyuMessages.createdAt} >= ${startIso}`,
          sql`${xinyuMessages.createdAt} <= ${endIso}`,
        ),
      );

    if (messages.length === 0) return false;

    const stats = this.aggregateStats(messages);
    const sender = await this.getUserNickname(senderUserId);

    const content = await this.generateReportContent(
      sender.nickname,
      stats,
    );

    const summary = this.buildSummary(sender.nickname, stats);

    await this.db.transaction(async (tx) => {
      await tx.insert(xinyuBroadcasts).values({
        userId: senderUserId,
        targetUserId: receiverUserId,
        content,
        summary,
        broadcastDate: reportDate,
        status: 'generated',
        direction: 'to_partner',
        toneStyle: 'warm_chatter',
        isRead: false,
      });

      const messageIds = messages.map((m) => m.id);
      if (messageIds.length > 0) {
        await tx
          .update(xinyuMessages)
          .set({ isReported: true })
          .where(sql`${xinyuMessages.id} IN (${sql.join(messageIds.map((id) => sql`${id}`), sql`, `)})`);
      }
    });

    this.logger.log(
      `报告已生成: binding=${bindingId}, from=${senderUserId}, to=${receiverUserId}, count=${messages.length}`,
    );

    return true;
  }

  private aggregateStats(
    messages: Array<typeof xinyuMessages.$inferSelect>,
  ): DailyMessageStats {
    const stats: DailyMessageStats = {
      textCount: 0,
      voiceCount: 0,
      imageCount: 0,
      videoCount: 0,
      textContents: [],
      voiceContents: [],
    };

    for (const msg of messages) {
      const type = msg.messageType as MessageType;
      switch (type) {
        case 'text':
          stats.textCount += 1;
          if (msg.content) stats.textContents.push(msg.content);
          break;
        case 'voice':
          stats.voiceCount += 1;
          if (msg.content) stats.voiceContents.push(msg.content);
          break;
        case 'image':
          stats.imageCount += 1;
          break;
        case 'video':
          stats.videoCount += 1;
          break;
        default:
          break;
      }
    }

    return stats;
  }

  private async generateReportContent(
    senderNickname: string,
    stats: DailyMessageStats,
  ): Promise<string> {
    // 优先尝试 AI 生成
    if (this.aiService.isConfigured) {
      try {
        const allTexts = [...stats.textContents, ...stats.voiceContents].join('\n');
        const result = await this.aiService.generateBroadcast({
          dailyData: {
            messageStats: stats,
            messages: allTexts,
          } as unknown as Record<string, unknown>,
          weatherInfo: {
            city: '',
            temperature: 0,
            tempHigh: 0,
            tempLow: 0,
            weather: '',
            weatherIcon: '',
            airQuality: '',
            airQualityLevel: 'good',
            wind: '',
            humidity: 0,
          },
          relation: '家人',
          senderTitle: senderNickname,
          toneStyle: 'warm_chatter',
          direction: 'to_partner',
        });
        return result;
      } catch (err) {
        this.logger.warn('AI生成报告失败，使用模板', (err as Error).message);
      }
    }

    // 模板生成
    return this.generateTemplateContent(senderNickname, stats);
  }

  private generateTemplateContent(
    senderNickname: string,
    stats: DailyMessageStats,
  ): string {
    const { textCount, voiceCount, imageCount, videoCount, textContents, voiceContents } = stats;

    const allTextParts = [...textContents, ...voiceContents];
    const textJoined = allTextParts.join(' ');
    const truncatedText = textJoined.length > 100
      ? `${textJoined.slice(0, 100)}...`
      : textJoined;

    const lines: string[] = [];
    lines.push('亲爱的家人：');
    lines.push('');
    lines.push(
      `今天${senderNickname}给你发了${textCount}条文字消息，${voiceCount}条语音，${imageCount}张图片，${videoCount}个视频。`,
    );

    if (truncatedText) {
      lines.push('');
      lines.push('TA想说的话：');
      lines.push(truncatedText);
    }

    if (voiceCount > 0 || imageCount > 0) {
      lines.push('');
      lines.push(
        `TA还录了${voiceCount}段语音想亲口说给你听，还有${imageCount}张照片要分享给你。`,
      );
    }

    lines.push('');
    lines.push('记得每天都有牵挂，一切都好。');

    return lines.join('\n');
  }

  private buildSummary(senderNickname: string, stats: DailyMessageStats): string {
    const parts: string[] = [];
    if (stats.textCount > 0) parts.push(`${stats.textCount}条文字`);
    if (stats.voiceCount > 0) parts.push(`${stats.voiceCount}条语音`);
    if (stats.imageCount > 0) parts.push(`${stats.imageCount}张图片`);
    if (stats.videoCount > 0) parts.push(`${stats.videoCount}个视频`);
    return `${senderNickname}今天发了${parts.join('、')}给你`;
  }

  private async getUserNickname(userId: string): Promise<{ nickname: string }> {
    const rows = await this.db
      .select({ nickname: xinyuUsers.nickname })
      .from(xinyuUsers)
      .where(eq(xinyuUsers.userId, userId))
      .limit(1);
    return { nickname: rows[0]?.nickname || '家人' };
  }
}
