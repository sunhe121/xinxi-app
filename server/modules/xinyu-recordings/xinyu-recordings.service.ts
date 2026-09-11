import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { xinyuRecordings } from '@server/database/schema';
import { eq, and } from 'drizzle-orm';
import type { Recording } from '@shared/api.interface';

const PRESET_RECORDINGS: { category: string; texts: string[] }[] = [
  {
    category: 'health',
    texts: [
      '记得按时吃药',
      '血压要经常量',
      '晚上早点休息别熬夜',
      '天冷了注意保暖',
    ],
  },
  {
    category: 'diet',
    texts: [
      '早饭一定要吃',
      '少吃油腻的东西',
      '多喝热水少喝饮料',
      '饭菜要趁热吃',
    ],
  },
  {
    category: 'weather',
    texts: [
      '今天降温了多穿点',
      '下雨了带伞',
      '天气好出去走走',
      '天热了注意防暑',
    ],
  },
  {
    category: 'emotion',
    texts: [
      '想你了',
      '我爱你',
      '有你在我很安心',
      '你好好的就是我的心愿',
    ],
  },
  {
    category: 'general',
    texts: [
      '我们都挺好的别担心',
      '有空打个电话',
      '注意安全照顾好自己',
      '周末回去看您',
    ],
  },
];

@Injectable()
export class XinyuRecordingsService {
  private readonly logger = new Logger(XinyuRecordingsService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getList(userId: string, category?: string): Promise<Recording[]> {
    const conditions = [eq(xinyuRecordings.userId, userId)];
    if (category) {
      conditions.push(eq(xinyuRecordings.category, category));
    }
    const rows = await this.db
      .select()
      .from(xinyuRecordings)
      .where(and(...conditions));
    return rows.map((row) => this.mapRow(row));
  }

  async saveRecording(userId: string, id: string, audioUrl: string, duration: number): Promise<Recording> {
    const updated = await this.db
      .update(xinyuRecordings)
      .set({
        audioUrl,
        duration,
        isRecorded: true,
        syncedToFamily: true,
        syncedAt: new Date(),
      })
      .where(and(eq(xinyuRecordings.id, id), eq(xinyuRecordings.userId, userId)))
      .returning();
    if (updated.length === 0) throw new NotFoundException('录音不存在');
    return this.mapRow(updated[0]);
  }

  async deleteRecording(userId: string, id: string): Promise<void> {
    const updated = await this.db
      .update(xinyuRecordings)
      .set({
        audioUrl: null,
        duration: 0,
        isRecorded: false,
        syncedToFamily: false,
        syncedAt: null,
      })
      .where(and(eq(xinyuRecordings.id, id), eq(xinyuRecordings.userId, userId)))
      .returning({ id: xinyuRecordings.id });
    if (updated.length === 0) throw new NotFoundException('录音不存在');
  }

  async syncToFamily(userId: string): Promise<void> {
    await this.db
      .update(xinyuRecordings)
      .set({
        syncedToFamily: true,
        syncedAt: new Date(),
      })
      .where(
        and(
          eq(xinyuRecordings.userId, userId),
          eq(xinyuRecordings.isRecorded, true),
        ),
      );
  }

  async initPresetRecordings(userId: string): Promise<void> {
    const existing = await this.db
      .select({ id: xinyuRecordings.id })
      .from(xinyuRecordings)
      .where(eq(xinyuRecordings.userId, userId))
      .limit(1);
    if (existing.length > 0) return;

    const values: typeof xinyuRecordings.$inferInsert[] = [];
    for (const group of PRESET_RECORDINGS) {
      for (const text of group.texts) {
        values.push({
          userId,
          category: group.category,
          presetText: text,
          isRecorded: false,
        });
      }
    }
    await this.db.insert(xinyuRecordings).values(values);
  }

  private mapRow(row: typeof xinyuRecordings.$inferSelect): Recording {
    return {
      id: row.id,
      userId: row.userId,
      category: row.category as Recording['category'],
      presetText: row.presetText,
      audioUrl: row.audioUrl ?? '',
      duration: row.duration ?? 0,
      isRecorded: row.isRecorded,
      syncedToFamily: row.syncedToFamily,
      syncedAt: row.syncedAt ? row.syncedAt.toISOString() : undefined,
    };
  }
}
