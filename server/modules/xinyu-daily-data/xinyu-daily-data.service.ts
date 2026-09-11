import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { xinyuDailyData } from '@server/database/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import type { DailyData, ActivityHourData, UserRole } from '@shared/api.interface';

@Injectable()
export class XinyuDailyDataService {
  private readonly logger = new Logger(XinyuDailyDataService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getTodayData(userId: string, role: string = 'child'): Promise<DailyData> {
    const today = this.getDateString(0);
    const rows = await this.db
      .select()
      .from(xinyuDailyData)
      .where(and(eq(xinyuDailyData.userId, userId), eq(xinyuDailyData.dataDate, today)))
      .limit(1);
    if (rows.length > 0) return this.mapRow(rows[0]);
    return this.generateMockData(userId, today, role as UserRole);
  }

  async getWeekData(userId: string, role: string = 'child'): Promise<DailyData[]> {
    const sevenDaysAgo = this.getDateString(6);
    const today = this.getDateString(0);
    const rows = await this.db
      .select()
      .from(xinyuDailyData)
      .where(
        and(
          eq(xinyuDailyData.userId, userId),
          gte(xinyuDailyData.dataDate, sevenDaysAgo),
        ),
      )
      .orderBy(desc(xinyuDailyData.dataDate));

    const existingDates = new Set(rows.map((r) => this.dateToStr(r.dataDate)));
    const result: DailyData[] = rows.map((r) => this.mapRow(r));

    for (let i = 0; i < 7; i++) {
      const dateStr = this.getDateString(i);
      if (!existingDates.has(dateStr)) {
        const mock = await this.generateMockData(userId, dateStr, role as UserRole);
        result.push(mock);
      }
    }

    result.sort((a, b) => b.dataDate.localeCompare(a.dataDate));
    return result;
  }

  async generateMockData(userId: string, dateStr: string, role: UserRole): Promise<DailyData> {
    const isElder = role === 'elder';
    const steps = isElder
      ? Math.floor(5000 + Math.random() * 3000)
      : Math.floor(3000 + Math.random() * 2000);
    const sleepHours = isElder
      ? Math.round((6 + Math.random() * 2) * 10) / 10
      : Math.round((5 + Math.random() * 2) * 10) / 10;
    const moodIndex = isElder
      ? Math.floor(7 + Math.random() * 3)
      : Math.floor(6 + Math.random() * 3);
    const outingStatus = Math.random() > 0.3 ? 'out' : 'home';
    const locationType = isElder
      ? outingStatus === 'out'
        ? ['park', 'supermarket'][Math.floor(Math.random() * 2)]
        : 'home'
      : outingStatus === 'out'
        ? 'company'
        : 'home';
    const callDuration = Math.floor(Math.random() * 30);

    const activityData = this.generateActivityData(steps, role, outingStatus);

    try {
      const inserted = await this.db
        .insert(xinyuDailyData)
        .values({
          userId,
          dataDate: dateStr,
          steps,
          sleepHours: String(sleepHours),
          outingStatus,
          locationType,
          callDuration,
          moodIndex,
          activityData: activityData as unknown as Record<string, unknown>,
        })
        .returning();
      return this.mapRow(inserted[0]);
    } catch (error) {
      this.logger.warn(`生成模拟数据失败，可能已存在: ${(error as Error).message}`);
      const rows = await this.db
        .select()
        .from(xinyuDailyData)
        .where(and(eq(xinyuDailyData.userId, userId), eq(xinyuDailyData.dataDate, dateStr)))
        .limit(1);
      if (rows.length > 0) return this.mapRow(rows[0]);
      throw error;
    }
  }

  private generateActivityData(
    totalSteps: number,
    role: UserRole,
    outingStatus: string,
  ): ActivityHourData[] {
    const result: ActivityHourData[] = [];
    const isElder = role === 'elder';
    const stepsDistribution = new Array(24).fill(0);
    const locations: string[] = new Array(24).fill('home');

    if (isElder) {
      for (let h = 6; h < 9; h++) stepsDistribution[h] = totalSteps * 0.15;
      for (let h = 9; h < 12; h++) stepsDistribution[h] = totalSteps * 0.08;
      for (let h = 14; h < 17; h++) stepsDistribution[h] = totalSteps * 0.06;
      for (let h = 17; h < 20; h++) stepsDistribution[h] = totalSteps * 0.1;
      if (outingStatus === 'out') {
        for (let h = 8; h < 11; h++) locations[h] = 'park';
        for (let h = 15; h < 17; h++) locations[h] = 'supermarket';
      }
    } else {
      for (let h = 7; h < 9; h++) stepsDistribution[h] = totalSteps * 0.1;
      for (let h = 12; h < 14; h++) stepsDistribution[h] = totalSteps * 0.08;
      for (let h = 18; h < 20; h++) stepsDistribution[h] = totalSteps * 0.12;
      if (outingStatus === 'out') {
        for (let h = 9; h < 18; h++) locations[h] = 'company';
      }
    }

    for (let h = 0; h < 24; h++) {
      const variance = 0.8 + Math.random() * 0.4;
      const hourSteps = Math.round(stepsDistribution[h] * variance);
      result.push({
        hour: h,
        steps: hourSteps,
        location: locations[h],
      });
    }

    return result;
  }

  private getDateString(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  }

  private dateToStr(date: string | Date): string {
    if (typeof date === 'string') return date;
    return date.toISOString().split('T')[0];
  }

  private mapRow(row: typeof xinyuDailyData.$inferSelect): DailyData {
    const activityData = Array.isArray(row.activityData)
      ? (row.activityData as ActivityHourData[])
      : [];
    return {
      id: row.id,
      userId: row.userId,
      dataDate: this.dateToStr(row.dataDate),
      steps: row.steps ?? 0,
      sleepHours: Number(row.sleepHours ?? 0),
      outingStatus: row.outingStatus as DailyData['outingStatus'],
      locationType: row.locationType as DailyData['locationType'],
      callDuration: row.callDuration ?? 0,
      moodIndex: row.moodIndex ?? 7,
      activityData,
    };
  }
}
