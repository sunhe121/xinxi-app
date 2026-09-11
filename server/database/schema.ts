/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { boolean, date, index, integer, jsonb, numeric, pgTable, text, uniqueIndex, uuid, varchar, customType } from "drizzle-orm/pg-core"

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

export function escapeLiteral(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

export const xinyuPrivacySettings = pgTable("xinyu_privacy_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull().unique(),
  stepsEnabled: boolean("steps_enabled").notNull().default(true),
  sleepEnabled: boolean("sleep_enabled").notNull().default(true),
  locationEnabled: boolean("location_enabled").notNull().default(true),
  ambientSoundEnabled: boolean("ambient_sound_enabled").notNull().default(false),
  callDurationEnabled: boolean("call_duration_enabled").notNull().default(true),
  heartRateEnabled: boolean("heart_rate_enabled").notNull().default(false),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("xinyu_privacy_settings_user_id_key").on(table.userId),
  // Complex index: CREATE UNIQUE INDEX xinyu_privacy_settings_user_id_idx ON xinyu_privacy_settings USING btree (((user_id).user_id)),
]);

export const xinyuInviteCodes = pgTable("xinyu_invite_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull(),
  code: varchar("code", { length: 6 }).notNull().unique(),
  relation: varchar("relation", { length: 20 }).notNull().default('other'),
  expiresAt: customTimestamptz("expires_at", { precision: 6 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default('active'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("xinyu_invite_codes_code_idx").on(table.code),
  // Complex index: CREATE INDEX xinyu_invite_codes_user_id_idx ON xinyu_invite_codes USING btree (((user_id).user_id)),
]);

export const xinyuDailyData = pgTable("xinyu_daily_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull(),
  dataDate: date("data_date").notNull().default('CURRENT_DATE'),
  steps: integer("steps").default(0),
  sleepHours: numeric("sleep_hours").default('7.0'),
  outingStatus: varchar("outing_status", { length: 20 }).default('home'),
  locationType: varchar("location_type", { length: 20 }).default('home'),
  callDuration: integer("call_duration").default(0),
  moodIndex: integer("mood_index").default(7),
  activityData: jsonb("activity_data").default('{}'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  uniqueIndex("xinyu_daily_data_user_id_data_date_key").on(table.userId, table.dataDate),
]);

export const xinyuRecordings = pgTable("xinyu_recordings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull(),
  category: varchar("category", { length: 20 }).notNull().default('general'),
  presetText: varchar("preset_text", { length: 200 }).notNull(),
  audioUrl: text("audio_url"),
  duration: integer("duration").default(0),
  isRecorded: boolean("is_recorded").notNull().default(false),
  syncedToFamily: boolean("synced_to_family").notNull().default(false),
  syncedAt: customTimestamptz("synced_at", { precision: 6 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_recordings_user_synced").on(table.userId, table.syncedToFamily),
]);

export const xinyuBroadcasts = pgTable("xinyu_broadcasts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull(),
  targetUserId: userProfile("target_user_id").notNull(),
  content: text("content").notNull(),
  summary: varchar("summary", { length: 500 }),
  broadcastDate: date("broadcast_date").notNull().default('CURRENT_DATE'),
  moodIndex: integer("mood_index").default(7),
  steps: integer("steps").default(0),
  sleepHours: numeric("sleep_hours").default('7.0'),
  weatherInfo: jsonb("weather_info").default('{}'),
  status: varchar("status", { length: 20 }).notNull().default('generated'),
  isRead: boolean("is_read").notNull().default(false),
  replyContent: text("reply_content"),
  replyAudioUrl: text("reply_audio_url"),
  direction: varchar("direction", { length: 20 }).notNull().default('to_partner'),
  toneStyle: varchar("tone_style", { length: 30 }).notNull().default('warm_chatter'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_broadcasts_target_direction").on(table.targetUserId, table.direction),
]);

export const xinyuBindings = pgTable("xinyu_bindings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userIdA: userProfile("user_id_a").notNull(),
  userIdB: userProfile("user_id_b").notNull(),
  status: varchar("status", { length: 20 }).notNull().default('bound'),
  boundAt: customTimestamptz("bound_at", { precision: 6 }).default(sql`CURRENT_TIMESTAMP`),
  relationAToB: varchar("relation_a_to_b", { length: 20 }).default('other'),
  relationBToA: varchar("relation_b_to_a", { length: 20 }).default('other'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
});

export const xinyuUsers = pgTable("xinyu_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull().unique(),
  nickname: varchar("nickname", { length: 100 }).notNull(),
  avatarUrl: text("avatar_url"),
  role: varchar("role", { length: 20 }).notNull().default('child'),
  inviteCode: varchar("invite_code", { length: 20 }).notNull().unique(),
  city: varchar("city", { length: 100 }).default('北京'),
  pushTime: varchar("push_time", { length: 50 }).default('08:00,20:00'),
  voiceType: varchar("voice_type", { length: 50 }).default('female_warm'),
  playbackSpeed: numeric("playback_speed").default('1.0'),
  toneStyle: varchar("tone_style", { length: 30 }).notNull().default('warm_chatter'),
  partnerNickname: varchar("partner_nickname", { length: 50 }),
  myPartnerTitle: varchar("my_partner_title", { length: 30 }),
  gender: varchar("gender", { length: 10 }).notNull().default('female'),
  myTitle: varchar("my_title", { length: 30 }),
  bio: varchar("bio", { length: 100 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("xinyu_users_user_id_key").on(table.userId),
  uniqueIndex("xinyu_users_invite_code_key").on(table.inviteCode),
]);

// table aliases
export const xinyuBindingsTable = xinyuBindings;
export const xinyuBroadcastsTable = xinyuBroadcasts;
export const xinyuDailyDataTable = xinyuDailyData;
export const xinyuInviteCodesTable = xinyuInviteCodes;
export const xinyuPrivacySettingsTable = xinyuPrivacySettings;
export const xinyuRecordingsTable = xinyuRecordings;
export const xinyuUsersTable = xinyuUsers;
