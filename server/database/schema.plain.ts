import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
  customType,
} from 'drizzle-orm/pg-core';

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

export const xinyuPrivacySettings = pgTable('xinyu_privacy_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 100 }).notNull().unique(),
  stepsEnabled: boolean('steps_enabled').notNull().default(true),
  sleepEnabled: boolean('sleep_enabled').notNull().default(true),
  locationEnabled: boolean('location_enabled').notNull().default(true),
  ambientSoundEnabled: boolean('ambient_sound_enabled').notNull().default(false),
  callDurationEnabled: boolean('call_duration_enabled').notNull().default(true),
  heartRateEnabled: boolean('heart_rate_enabled').notNull().default(false),
  createdAt: customTimestamptz('_created_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar('_created_by', { length: 100 }),
  updatedAt: customTimestamptz('_updated_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar('_updated_by', { length: 100 }),
}, (table) => [
  uniqueIndex('xinyu_privacy_settings_user_id_key').on(table.userId),
]);

export const xinyuInviteCodes = pgTable('xinyu_invite_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 100 }).notNull(),
  code: varchar('code', { length: 6 }).notNull().unique(),
  relation: varchar('relation', { length: 20 }).notNull().default('other'),
  expiresAt: customTimestamptz('expires_at', { precision: 6 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: customTimestamptz('_created_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar('_created_by', { length: 100 }),
  updatedAt: customTimestamptz('_updated_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar('_updated_by', { length: 100 }),
}, (table) => [
  uniqueIndex('xinyu_invite_codes_code_idx').on(table.code),
  index('xinyu_invite_codes_user_id_idx').on(table.userId),
]);

export const xinyuDailyData = pgTable('xinyu_daily_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 100 }).notNull(),
  dataDate: date('data_date').notNull().default('CURRENT_DATE'),
  steps: integer('steps').default(0),
  sleepHours: numeric('sleep_hours').default('7.0'),
  outingStatus: varchar('outing_status', { length: 20 }).default('home'),
  locationType: varchar('location_type', { length: 20 }).default('home'),
  callDuration: integer('call_duration').default(0),
  moodIndex: integer('mood_index').default(7),
  activityData: jsonb('activity_data').default('{}'),
  createdAt: customTimestamptz('_created_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar('_created_by', { length: 100 }),
  updatedAt: customTimestamptz('_updated_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar('_updated_by', { length: 100 }),
}, (table) => [
  uniqueIndex('xinyu_daily_data_user_id_data_date_key').on(table.userId, table.dataDate),
]);

export const xinyuRecordings = pgTable('xinyu_recordings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 100 }).notNull(),
  category: varchar('category', { length: 20 }).notNull().default('general'),
  presetText: varchar('preset_text', { length: 200 }).notNull(),
  audioUrl: text('audio_url'),
  duration: integer('duration').default(0),
  isRecorded: boolean('is_recorded').notNull().default(false),
  syncedToFamily: boolean('synced_to_family').notNull().default(false),
  syncedAt: customTimestamptz('synced_at', { precision: 6 }),
  createdAt: customTimestamptz('_created_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar('_created_by', { length: 100 }),
  updatedAt: customTimestamptz('_updated_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar('_updated_by', { length: 100 }),
}, (table) => [
  index('idx_recordings_user_synced').on(table.userId, table.syncedToFamily),
]);

export const xinyuMessages = pgTable('xinyu_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  bindingId: uuid('binding_id').notNull().references(() => xinyuBindings.id, { onDelete: 'cascade' }),
  senderUserId: varchar('sender_user_id', { length: 100 }).notNull(),
  receiverUserId: varchar('receiver_user_id', { length: 100 }).notNull(),
  messageType: varchar('message_type', { length: 20 }).notNull().default('text'),
  content: text('content'),
  fileUrl: text('file_url'),
  duration: integer('duration').default(0),
  isReported: boolean('is_reported').notNull().default(false),
  createdAt: customTimestamptz('_created_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar('_created_by', { length: 100 }),
  updatedAt: customTimestamptz('_updated_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar('_updated_by', { length: 100 }),
}, (table) => [
  index('idx_messages_binding_created').on(table.bindingId, table.createdAt),
  index('idx_messages_receiver_reported').on(table.receiverUserId, table.isReported),
]);

export const xinyuBroadcasts = pgTable('xinyu_broadcasts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 100 }).notNull(),
  targetUserId: varchar('target_user_id', { length: 100 }).notNull(),
  content: text('content').notNull(),
  summary: varchar('summary', { length: 500 }),
  broadcastDate: date('broadcast_date').notNull().default('CURRENT_DATE'),
  moodIndex: integer('mood_index').default(7),
  steps: integer('steps').default(0),
  sleepHours: numeric('sleep_hours').default('7.0'),
  weatherInfo: jsonb('weather_info').default('{}'),
  status: varchar('status', { length: 20 }).notNull().default('generated'),
  isRead: boolean('is_read').notNull().default(false),
  replyContent: text('reply_content'),
  replyAudioUrl: text('reply_audio_url'),
  direction: varchar('direction', { length: 20 }).notNull().default('to_partner'),
  toneStyle: varchar('tone_style', { length: 30 }).notNull().default('warm_chatter'),
  createdAt: customTimestamptz('_created_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar('_created_by', { length: 100 }),
  updatedAt: customTimestamptz('_updated_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar('_updated_by', { length: 100 }),
}, (table) => [
  index('idx_broadcasts_target_direction').on(table.targetUserId, table.direction),
]);

export const xinyuBindings = pgTable('xinyu_bindings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userIdA: varchar('user_id_a', { length: 100 }).notNull(),
  userIdB: varchar('user_id_b', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('bound'),
  boundAt: customTimestamptz('bound_at', { precision: 6 }).default(sql`CURRENT_TIMESTAMP`),
  relationAToB: varchar('relation_a_to_b', { length: 20 }).default('other'),
  relationBToA: varchar('relation_b_to_a', { length: 20 }).default('other'),
  remarkNameA: varchar('remark_name_a', { length: 50 }),
  remarkNameB: varchar('remark_name_b', { length: 50 }),
  createdAt: customTimestamptz('_created_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar('_created_by', { length: 100 }),
  updatedAt: customTimestamptz('_updated_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar('_updated_by', { length: 100 }),
});

export const xinyuUsers = pgTable('xinyu_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 100 }).notNull().unique(),
  nickname: varchar('nickname', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  role: varchar('role', { length: 20 }).notNull().default('child'),
  inviteCode: varchar('invite_code', { length: 20 }).notNull().unique(),
  city: varchar('city', { length: 100 }).default('北京'),
  pushTime: varchar('push_time', { length: 50 }).default('08:00,20:00'),
  voiceType: varchar('voice_type', { length: 50 }).default('female_warm'),
  playbackSpeed: numeric('playback_speed').default('1.0'),
  toneStyle: varchar('tone_style', { length: 30 }).notNull().default('warm_chatter'),
  partnerNickname: varchar('partner_nickname', { length: 50 }),
  myPartnerTitle: varchar('my_partner_title', { length: 30 }),
  gender: varchar('gender', { length: 10 }).notNull().default('female'),
  myTitle: varchar('my_title', { length: 30 }),
  bio: varchar('bio', { length: 100 }),
  passwordHash: varchar('password_hash', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  languageProfile: text('language_profile'),
  createdAt: customTimestamptz('_created_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar('_created_by', { length: 100 }),
  updatedAt: customTimestamptz('_updated_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar('_updated_by', { length: 100 }),
}, (table) => [
  uniqueIndex('xinyu_users_user_id_key').on(table.userId),
  uniqueIndex('xinyu_users_invite_code_key').on(table.inviteCode),
  uniqueIndex('xinyu_users_phone_idx').on(table.phone),
]);

export const xinyuLanguageSamples = pgTable('xinyu_language_samples', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 100 }).notNull(),
  category: varchar('category', { length: 20 }).notNull().default('general'),
  title: varchar('title', { length: 100 }).notNull(),
  transcript: text('transcript').notNull(),
  audioUrl: text('audio_url'),
  duration: integer('duration').default(0),
  createdAt: customTimestamptz('_created_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar('_created_by', { length: 100 }),
  updatedAt: customTimestamptz('_updated_at', { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar('_updated_by', { length: 100 }),
}, (table) => [
  index('xinyu_language_samples_user_idx').on(table.userId),
]);

export const xinyuMessagesTable = xinyuMessages;
export const xinyuBindingsTable = xinyuBindings;
export const xinyuBroadcastsTable = xinyuBroadcasts;
export const xinyuDailyDataTable = xinyuDailyData;
export const xinyuInviteCodesTable = xinyuInviteCodes;
export const xinyuPrivacySettingsTable = xinyuPrivacySettings;
export const xinyuRecordingsTable = xinyuRecordings;
export const xinyuUsersTable = xinyuUsers;
export const xinyuLanguageSamplesTable = xinyuLanguageSamples;
