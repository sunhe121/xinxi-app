// eslint-disable-next-line import/no-extraneous-dependencies
import postgres from 'postgres';
import { Logger } from '@nestjs/common';

const logger = new Logger('Migrate');

const MIGRATION_STATEMENTS: Array<{ name: string; sql: string }> = [
  {
    name: 'user_profile type',
    sql: `DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_profile') THEN
    CREATE TYPE user_profile AS (
      user_id TEXT,
      user_name TEXT,
      avatar_url TEXT,
      user_name_i18n TEXT
    );
  END IF;
END$$;`,
  },
  {
    name: 'pgcrypto extension',
    sql: 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";',
  },
  {
    name: 'xinyu_users table',
    sql: `CREATE TABLE IF NOT EXISTS xinyu_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id user_profile NOT NULL UNIQUE,
  nickname VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'child',
  invite_code VARCHAR(20) NOT NULL UNIQUE,
  city VARCHAR(100) DEFAULT '北京',
  push_time VARCHAR(50) DEFAULT '08:00,20:00',
  voice_type VARCHAR(50) DEFAULT 'female_warm',
  playback_speed NUMERIC DEFAULT '1.0',
  tone_style VARCHAR(30) NOT NULL DEFAULT 'warm_chatter',
  partner_nickname VARCHAR(50),
  my_partner_title VARCHAR(30),
  gender VARCHAR(10) NOT NULL DEFAULT 'female',
  my_title VARCHAR(30),
  bio VARCHAR(100),
  password_hash VARCHAR(255),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile
);`,
  },
  {
    name: 'xinyu_bindings table',
    sql: `CREATE TABLE IF NOT EXISTS xinyu_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_a user_profile NOT NULL,
  user_id_b user_profile NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'bound',
  bound_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  relation_a_to_b VARCHAR(20) DEFAULT 'other',
  relation_b_to_a VARCHAR(20) DEFAULT 'other',
  remark_name_a VARCHAR(50),
  remark_name_b VARCHAR(50),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile
);`,
  },
  {
    name: 'xinyu_messages table',
    sql: `CREATE TABLE IF NOT EXISTS xinyu_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  binding_id UUID NOT NULL REFERENCES xinyu_bindings(id) ON DELETE CASCADE,
  sender_user_id user_profile NOT NULL,
  receiver_user_id user_profile NOT NULL,
  message_type VARCHAR(20) NOT NULL DEFAULT 'text',
  content TEXT,
  file_url TEXT,
  duration INTEGER DEFAULT 0,
  is_reported BOOLEAN NOT NULL DEFAULT FALSE,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile
);`,
  },
  {
    name: 'idx_messages_binding_created index',
    sql: 'CREATE INDEX IF NOT EXISTS idx_messages_binding_created ON xinyu_messages (binding_id, _created_at DESC);',
  },
  {
    name: 'idx_messages_receiver_reported index',
    sql: 'CREATE INDEX IF NOT EXISTS idx_messages_receiver_reported ON xinyu_messages (((receiver_user_id).user_id), is_reported);',
  },
  {
    name: 'xinyu_broadcasts table',
    sql: `CREATE TABLE IF NOT EXISTS xinyu_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id user_profile NOT NULL,
  target_user_id user_profile NOT NULL,
  content TEXT NOT NULL,
  summary VARCHAR(500),
  broadcast_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood_index INTEGER DEFAULT 7,
  steps INTEGER DEFAULT 0,
  sleep_hours NUMERIC DEFAULT '7.0',
  weather_info JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'generated',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  reply_content TEXT,
  reply_audio_url TEXT,
  direction VARCHAR(20) NOT NULL DEFAULT 'to_partner',
  tone_style VARCHAR(30) NOT NULL DEFAULT 'warm_chatter',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile
);`,
  },
  {
    name: 'idx_broadcasts_target_direction index',
    sql: 'CREATE INDEX IF NOT EXISTS idx_broadcasts_target_direction ON xinyu_broadcasts (((target_user_id).user_id), direction);',
  },
  {
    name: 'xinyu_recordings table',
    sql: `CREATE TABLE IF NOT EXISTS xinyu_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id user_profile NOT NULL,
  category VARCHAR(20) NOT NULL DEFAULT 'general',
  preset_text VARCHAR(200) NOT NULL,
  audio_url TEXT,
  duration INTEGER DEFAULT 0,
  is_recorded BOOLEAN NOT NULL DEFAULT FALSE,
  synced_to_family BOOLEAN NOT NULL DEFAULT FALSE,
  synced_at TIMESTAMPTZ(6),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile
);`,
  },
  {
    name: 'idx_recordings_user_synced index',
    sql: 'CREATE INDEX IF NOT EXISTS idx_recordings_user_synced ON xinyu_recordings (((user_id).user_id), synced_to_family);',
  },
  {
    name: 'xinyu_daily_data table',
    sql: `CREATE TABLE IF NOT EXISTS xinyu_daily_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id user_profile NOT NULL,
  data_date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER DEFAULT 0,
  sleep_hours NUMERIC DEFAULT '7.0',
  outing_status VARCHAR(20) DEFAULT 'home',
  location_type VARCHAR(20) DEFAULT 'home',
  call_duration INTEGER DEFAULT 0,
  mood_index INTEGER DEFAULT 7,
  activity_data JSONB DEFAULT '{}',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile,
  UNIQUE (((user_id).user_id), data_date)
);`,
  },
  {
    name: 'xinyu_privacy_settings table',
    sql: `CREATE TABLE IF NOT EXISTS xinyu_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id user_profile NOT NULL UNIQUE,
  steps_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sleep_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  location_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ambient_sound_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  call_duration_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  heart_rate_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile
);`,
  },
  {
    name: 'xinyu_invite_codes table',
    sql: `CREATE TABLE IF NOT EXISTS xinyu_invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id user_profile NOT NULL,
  code VARCHAR(6) NOT NULL UNIQUE,
  relation VARCHAR(20) NOT NULL DEFAULT 'other',
  expires_at TIMESTAMPTZ(6) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile
);`,
  },
  {
    name: 'xinyu_invite_codes_code_idx index',
    sql: 'CREATE INDEX IF NOT EXISTS xinyu_invite_codes_code_idx ON xinyu_invite_codes (code);',
  },
];

export async function runMigrations(databaseUrl: string): Promise<void> {
  const sql = postgres(databaseUrl, { connect_timeout: 10, max: 1 });
  try {
    logger.log(`Running ${MIGRATION_STATEMENTS.length} migration statements...`);
    for (let i = 0; i < MIGRATION_STATEMENTS.length; i++) {
      const stmt = MIGRATION_STATEMENTS[i];
      try {
        await sql.unsafe(stmt.sql);
        logger.log(`  [${i + 1}/${MIGRATION_STATEMENTS.length}] ${stmt.name} - OK`);
      } catch (err) {
        const error = err as Error;
        logger.error(`  [${i + 1}/${MIGRATION_STATEMENTS.length}] ${stmt.name} - FAILED: ${error.message}`);
        throw err;
      }
    }
    logger.log('All migrations completed successfully');
  } finally {
    try {
      await sql.end({ timeout: 2 });
    } catch {
      // ignore cleanup errors
    }
  }
}

if (require.main === module) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }
  runMigrations(databaseUrl)
    .then(() => {
      logger.log('Done');
      process.exit(0);
    })
    .catch((err: Error) => {
      logger.error(`Failed: ${err.message}`);
      process.exit(1);
    });
}
