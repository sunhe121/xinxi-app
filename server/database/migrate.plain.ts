// eslint-disable-next-line import/no-extraneous-dependencies
import postgres from 'postgres';
import { Logger } from '@nestjs/common';

const logger = new Logger('Migrate');

const CREATE_TABLES_SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS xinyu_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL UNIQUE,
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
  _created_by VARCHAR(100),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS xinyu_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_a VARCHAR(100) NOT NULL,
  user_id_b VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'bound',
  bound_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  relation_a_to_b VARCHAR(20) DEFAULT 'other',
  relation_b_to_a VARCHAR(20) DEFAULT 'other',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by VARCHAR(100),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS xinyu_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  target_user_id VARCHAR(100) NOT NULL,
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
  _created_by VARCHAR(100),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_target_direction
  ON xinyu_broadcasts (target_user_id, direction);

CREATE TABLE IF NOT EXISTS xinyu_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  category VARCHAR(20) NOT NULL DEFAULT 'general',
  preset_text VARCHAR(200) NOT NULL,
  audio_url TEXT,
  duration INTEGER DEFAULT 0,
  is_recorded BOOLEAN NOT NULL DEFAULT FALSE,
  synced_to_family BOOLEAN NOT NULL DEFAULT FALSE,
  synced_at TIMESTAMPTZ(6),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by VARCHAR(100),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_recordings_user_synced
  ON xinyu_recordings (user_id, synced_to_family);

CREATE TABLE IF NOT EXISTS xinyu_daily_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  data_date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER DEFAULT 0,
  sleep_hours NUMERIC DEFAULT '7.0',
  outing_status VARCHAR(20) DEFAULT 'home',
  location_type VARCHAR(20) DEFAULT 'home',
  call_duration INTEGER DEFAULT 0,
  mood_index INTEGER DEFAULT 7,
  activity_data JSONB DEFAULT '{}',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by VARCHAR(100),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by VARCHAR(100),
  UNIQUE (user_id, data_date)
);

CREATE TABLE IF NOT EXISTS xinyu_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL UNIQUE,
  steps_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sleep_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  location_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ambient_sound_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  call_duration_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  heart_rate_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by VARCHAR(100),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS xinyu_invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  code VARCHAR(6) NOT NULL UNIQUE,
  relation VARCHAR(20) NOT NULL DEFAULT 'other',
  expires_at TIMESTAMPTZ(6) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by VARCHAR(100),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS xinyu_invite_codes_code_idx
  ON xinyu_invite_codes (code);
`;

export async function runMigrations(databaseUrl: string): Promise<void> {
  const sql = postgres(databaseUrl);
  try {
    await sql.unsafe(CREATE_TABLES_SQL);
    logger.log('All tables created successfully');
  } finally {
    await sql.end();
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
