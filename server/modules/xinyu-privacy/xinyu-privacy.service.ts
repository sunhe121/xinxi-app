import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { xinyuPrivacySettings } from '@server/database/schema';
import { eq } from 'drizzle-orm';
import type { PrivacySettings, UpdatePrivacyRequest } from '@shared/api.interface';

@Injectable()
export class XinyuPrivacyService {
  private readonly logger = new Logger(XinyuPrivacyService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getSettings(userId: string): Promise<PrivacySettings> {
    const rows = await this.db
      .select()
      .from(xinyuPrivacySettings)
      .where(eq(xinyuPrivacySettings.userId, userId))
      .limit(1);
    if (rows.length === 0) {
      return this.initSettings(userId);
    }
    return this.mapRow(rows[0]);
  }

  async updateSettings(userId: string, data: UpdatePrivacyRequest): Promise<PrivacySettings> {
    const existing = await this.db
      .select({ id: xinyuPrivacySettings.id })
      .from(xinyuPrivacySettings)
      .where(eq(xinyuPrivacySettings.userId, userId))
      .limit(1);

    if (existing.length === 0) {
      await this.initSettings(userId);
    }

    const patch: Record<string, unknown> = {};
    if (data.stepsEnabled !== undefined) patch.stepsEnabled = data.stepsEnabled;
    if (data.sleepEnabled !== undefined) patch.sleepEnabled = data.sleepEnabled;
    if (data.locationEnabled !== undefined) patch.locationEnabled = data.locationEnabled;
    if (data.ambientSoundEnabled !== undefined) patch.ambientSoundEnabled = data.ambientSoundEnabled;
    if (data.callDurationEnabled !== undefined) patch.callDurationEnabled = data.callDurationEnabled;
    if (data.heartRateEnabled !== undefined) patch.heartRateEnabled = data.heartRateEnabled;

    if (Object.keys(patch).length === 0) return this.getSettings(userId);

    const updated = await this.db
      .update(xinyuPrivacySettings)
      .set(patch)
      .where(eq(xinyuPrivacySettings.userId, userId))
      .returning();

    return this.mapRow(updated[0]);
  }

  private async initSettings(userId: string): Promise<PrivacySettings> {
    const inserted = await this.db
      .insert(xinyuPrivacySettings)
      .values({
        userId,
        stepsEnabled: false,
        sleepEnabled: false,
        locationEnabled: false,
        ambientSoundEnabled: false,
        callDurationEnabled: false,
        heartRateEnabled: false,
      })
      .onConflictDoNothing()
      .returning();

    if (inserted.length > 0) return this.mapRow(inserted[0]);

    const rows = await this.db
      .select()
      .from(xinyuPrivacySettings)
      .where(eq(xinyuPrivacySettings.userId, userId))
      .limit(1);
    return this.mapRow(rows[0]);
  }

  private mapRow(row: typeof xinyuPrivacySettings.$inferSelect): PrivacySettings {
    return {
      stepsEnabled: row.stepsEnabled,
      sleepEnabled: row.sleepEnabled,
      locationEnabled: row.locationEnabled,
      ambientSoundEnabled: row.ambientSoundEnabled,
      callDurationEnabled: row.callDurationEnabled,
      heartRateEnabled: row.heartRateEnabled,
    };
  }
}
