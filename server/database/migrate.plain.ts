// eslint-disable-next-line import/no-extraneous-dependencies
import postgres from 'postgres';
import { Logger } from '@nestjs/common';

const logger = new Logger('Migrate');

const MIGRATION_STATEMENTS: Array<{ name: string; sql: string }> = [
  {
    name: 'pgcrypto extension',
    sql: 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";',
  },
  {
    name: 'file_attachment custom type',
    sql: `DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'file_attachment') THEN
    CREATE TYPE file_attachment AS (
      bucket_id text,
      file_path text
    );
  END IF;
END$$;`,
  },
  {
    name: 'xinyu_users table',
    sql: `CREATE TABLE IF NOT EXISTS xinyu_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  nickname VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'child',
  invite_code VARCHAR(20) NOT NULL,
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
  phone VARCHAR(20),
  language_profile TEXT,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by VARCHAR(100),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by VARCHAR(100)
);`,
  },
  {
    name: 'xinyu_users unique indexes',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS xinyu_users_user_id_key ON xinyu_users (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS xinyu_users_invite_code_key ON xinyu_users (invite_code);
CREATE UNIQUE INDEX IF NOT EXISTS xinyu_users_phone_idx ON xinyu_users (phone);`,
  },
  {
    name: 'xinyu_bindings table',
    sql: `CREATE TABLE IF NOT EXISTS xinyu_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_a VARCHAR(100) NOT NULL,
  user_id_b VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'bound',
  bound_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  relation_a_to_b VARCHAR(20) DEFAULT 'other',
  relation_b_to_a VARCHAR(20) DEFAULT 'other',
  remark_name_a VARCHAR(50),
  remark_name_b VARCHAR(50),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by VARCHAR(100),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by VARCHAR(100)
);`,
  },
  {
    name: 'xinyu_messages table',
    sql: `CREATE TABLE IF NOT EXISTS xinyu_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  binding_id UUID NOT NULL REFERENCES xinyu_bindings(id) ON DELETE CASCADE,
  sender_user_id VARCHAR(100) NOT NULL,
  receiver_user_id VARCHAR(100) NOT NULL,
  message_type VARCHAR(20) NOT NULL DEFAULT 'text',
  content TEXT,
  file_url TEXT,
  duration INTEGER DEFAULT 0,
  is_reported BOOLEAN NOT NULL DEFAULT FALSE,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by VARCHAR(100),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by VARCHAR(100)
);`,
  },
  {
    name: 'xinyu_messages indexes',
    sql: `CREATE INDEX IF NOT EXISTS idx_messages_binding_created ON xinyu_messages (binding_id, _created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_reported ON xinyu_messages (receiver_user_id, is_reported);`,
  },
  {
    name: 'xinyu_broadcasts table',
    sql: `CREATE TABLE IF NOT EXISTS xinyu_broadcasts (
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
);`,
  },
  {
    name: 'xinyu_broadcasts indexes',
    sql: 'CREATE INDEX IF NOT EXISTS idx_broadcasts_target_direction ON xinyu_broadcasts (target_user_id, direction);',
  },
  {
    name: 'xinyu_recordings table',
    sql: `CREATE TABLE IF NOT EXISTS xinyu_recordings (
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
);`,
  },
  {
    name: 'xinyu_recordings indexes',
    sql: 'CREATE INDEX IF NOT EXISTS idx_recordings_user_synced ON xinyu_recordings (user_id, synced_to_family);',
  },
  {
    name: 'xinyu_daily_data table',
    sql: `CREATE TABLE IF NOT EXISTS xinyu_daily_data (
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
  _updated_by VARCHAR(100)
);`,
  },
  {
    name: 'xinyu_daily_data unique index',
    sql: 'CREATE UNIQUE INDEX IF NOT EXISTS xinyu_daily_data_user_id_data_date_key ON xinyu_daily_data (user_id, data_date);',
  },
  {
    name: 'xinyu_privacy_settings table',
    sql: `CREATE TABLE IF NOT EXISTS xinyu_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
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
);`,
  },
  {
    name: 'xinyu_privacy_settings unique index',
    sql: 'CREATE UNIQUE INDEX IF NOT EXISTS xinyu_privacy_settings_user_id_key ON xinyu_privacy_settings (user_id);',
  },
  {
    name: 'xinyu_invite_codes table',
    sql: `CREATE TABLE IF NOT EXISTS xinyu_invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  code VARCHAR(6) NOT NULL,
  relation VARCHAR(20) NOT NULL DEFAULT 'other',
  expires_at TIMESTAMPTZ(6) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by VARCHAR(100),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by VARCHAR(100)
);`,
  },
  {
    name: 'xinyu_invite_codes indexes',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS xinyu_invite_codes_code_idx ON xinyu_invite_codes (code);
CREATE INDEX IF NOT EXISTS xinyu_invite_codes_user_id_idx ON xinyu_invite_codes (user_id);`,
  },
  {
    name: 'xinyu_users_language_profile column',
    sql: `DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'xinyu_users' AND column_name = 'language_profile') THEN
    ALTER TABLE xinyu_users ADD COLUMN language_profile TEXT;
  END IF;
END$$;`,
  },
  {
    name: 'xinyu_language_samples table',
    sql: `CREATE TABLE IF NOT EXISTS xinyu_language_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  category VARCHAR(20) NOT NULL DEFAULT 'general',
  title VARCHAR(100) NOT NULL,
  transcript TEXT NOT NULL,
  audio_url TEXT,
  duration INTEGER DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by VARCHAR(100),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by VARCHAR(100)
);`,
  },
  {
    name: 'xinyu_language_samples index',
    sql: 'CREATE INDEX IF NOT EXISTS xinyu_language_samples_user_idx ON xinyu_language_samples (user_id);',
  },
  {
    name: 'RLS enable and anon policy for all xinyu tables',
    sql: `DO $$
DECLARE
  rec record;
  policy_name text;
BEGIN
  FOR rec IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename LIKE 'xinyu_%'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', rec.tablename);

    policy_name := 'anon_all_policy_' || rec.tablename;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = rec.tablename
        AND policyname = policy_name
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I AS PERMISSIVE FOR ALL TO anon USING (true) WITH CHECK (true)',
        policy_name, rec.tablename
      );
    END IF;

    policy_name := 'authenticated_all_policy_' || rec.tablename;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = rec.tablename
        AND policyname = policy_name
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true)',
        policy_name, rec.tablename
      );
    END IF;
  END LOOP;
END$$;`,
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
        logger.error(`  SQL was:\n${stmt.sql}`);
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
