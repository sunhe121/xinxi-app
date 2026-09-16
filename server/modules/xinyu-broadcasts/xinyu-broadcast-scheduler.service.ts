import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { XinyuBroadcastsService } from './xinyu-broadcasts.service';
import { XinyuBindingsService } from '../xinyu-bindings/xinyu-bindings.service';
import { XinyuUsersService } from '../xinyu-users/xinyu-users.service';
import type { BroadcastDirection, ToneStyle } from '@shared/api.interface';

@Injectable()
export class XinyuBroadcastSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(XinyuBroadcastSchedulerService.name);
  private readonly CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
  private readonly TIME_WINDOW_MINUTES = 30;

  constructor(
    private readonly broadcastsService: XinyuBroadcastsService,
    private readonly bindingsService: XinyuBindingsService,
    private readonly usersService: XinyuUsersService,
  ) {}

  onModuleInit(): void {
    // Start the scheduler after a short delay so app startup is not blocked
    setTimeout(() => {
      this.logger.log('每日报告定时任务已启动');
      void this.runDailyReportGeneration();
      setInterval(() => {
        void this.runDailyReportGeneration();
      }, this.CHECK_INTERVAL_MS);
    }, 5000);
  }

  async runDailyReportGeneration(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    this.logger.log(`开始检查每日报告生成，当前时间: ${currentHour}:${currentMinute}`);

    try {
      const bindings = await this.bindingsService.getAllBoundBindings();
      this.logger.log(`发现 ${bindings.length} 个已绑定关系`);

      for (const binding of bindings) {
        const { userIdA, userIdB } = binding;

        // Generate both directions
        await this.tryGenerateForDirection(
          userIdA,
          userIdB,
          'to_partner',
          today,
          currentTotalMinutes,
        );
        await this.tryGenerateForDirection(
          userIdB,
          userIdA,
          'to_partner',
          today,
          currentTotalMinutes,
        );
      }

      this.logger.log('每日报告生成检查完成');
    } catch (error) {
      this.logger.error('每日报告生成任务失败', error as Error);
    }
  }

  private async tryGenerateForDirection(
    senderUserId: string,
    targetUserId: string,
    direction: BroadcastDirection,
    today: string,
    currentTotalMinutes: number,
  ): Promise<void> {
    // Check if already generated today
    const alreadyExists = await this.broadcastsService.hasDailyReportFor(
      senderUserId,
      targetUserId,
      direction,
      today,
    );
    if (alreadyExists) {
      return;
    }

    // Get sender's user profile to check pushTime
    const senderUser = await this.usersService.findByUserId(senderUserId);
    if (!senderUser) {
      return;
    }

    const pushTimeStr = senderUser.pushTime || '08:00,20:00';
    const pushTimes = pushTimeStr.split(',').map((t) => t.trim()).filter(Boolean);

    // Check if current time is within any pushTime window
    const shouldGenerate = pushTimes.some((timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      if (Number.isNaN(h) || Number.isNaN(m)) return false;
      const pushTotalMinutes = h * 60 + m;
      const diff = currentTotalMinutes - pushTotalMinutes;
      return diff >= 0 && diff < this.TIME_WINDOW_MINUTES;
    });

    if (!shouldGenerate) {
      return;
    }

    const toneStyle = (senderUser.toneStyle as ToneStyle) || 'warm_chatter';

    try {
      this.logger.log(`为用户 ${senderUserId} → ${targetUserId} 生成每日报告`);
      const result = await this.broadcastsService.generateDailyReport(
        senderUserId,
        targetUserId,
        direction,
        toneStyle,
      );
      this.logger.log(`每日报告生成成功: ${result.broadcastId}`);
    } catch (error) {
      this.logger.error(
        `每日报告生成失败: ${senderUserId} → ${targetUserId}`,
        error as Error,
      );
    }
  }
}
