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
    name: 'user_profile custom type',
    sql: `DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_profile') THEN
    CREATE TYPE user_profile AS (
      user_id text,
      name text,
      avatar text,
      email text,
      status text
    );
  END IF;
END$$;`,
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
  phone VARCHAR(20) UNIQUE,
  language_profile TEXT,
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
    sql: 'CREATE INDEX IF NOT EXISTS idx_messages_receiver_reported ON xinyu_messages (receiver_user_id, is_reported);',
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
    sql: 'CREATE INDEX IF NOT EXISTS idx_broadcasts_target_direction ON xinyu_broadcasts (target_user_id, direction);',
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
    sql: 'CREATE INDEX IF NOT EXISTS idx_recordings_user_synced ON xinyu_recordings (user_id, synced_to_family);',
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
  UNIQUE ((user_id).user_id, data_date)
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
  {
    name: 'xinyu_users_phone column',
    sql: `DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'xinyu_users' AND column_name = 'phone') THEN
    ALTER TABLE xinyu_users ADD COLUMN phone VARCHAR(20);
    CREATE UNIQUE INDEX IF NOT EXISTS xinyu_users_phone_idx ON xinyu_users (phone);
  END IF;
END$$;`,
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
  user_id user_profile NOT NULL,
  category VARCHAR(20) NOT NULL DEFAULT 'general',
  title VARCHAR(100) NOT NULL,
  transcript TEXT NOT NULL,
  audio_url TEXT,
  duration INTEGER DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile
);`,
  },
  {
    name: 'xinyu_language_samples_user_idx index',
    sql: 'CREATE INDEX IF NOT EXISTS xinyu_language_samples_user_idx ON xinyu_language_samples (user_id);',
  },
  {
    name: 'xinyu_users_user_id column type migration',
    sql: `DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type FROM information_schema.columns
  WHERE table_name = 'xinyu_users' AND column_name = 'user_id';
  IF col_type = 'character varying' THEN
    ALTER TABLE xinyu_users ALTER COLUMN user_id TYPE user_profile
    USING CASE WHEN user_id IS NULL THEN NULL ELSE ROW(user_id, '', '', '', '')::user_profile END;
  END IF;
END$$;`,
  },
  {
    name: 'xinyu_bindings user_id_a type migration',
    sql: `DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type FROM information_schema.columns
  WHERE table_name = 'xinyu_bindings' AND column_name = 'user_id_a';
  IF col_type = 'character varying' THEN
    ALTER TABLE xinyu_bindings ALTER COLUMN user_id_a TYPE user_profile
    USING CASE WHEN user_id_a IS NULL THEN NULL ELSE ROW(user_id_a, '', '', '', '')::user_profile END;
    ALTER TABLE xinyu_bindings ALTER COLUMN user_id_b TYPE user_profile
    USING CASE WHEN user_id_b IS NULL THEN NULL ELSE ROW(user_id_b, '', '', '', '')::user_profile END;
  END IF;
END$$;`,
  },
  {
    name: 'xinyu_messages user_id type migration',
    sql: `DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type FROM information_schema.columns
  WHERE table_name = 'xinyu_messages' AND column_name = 'sender_user_id';
  IF col_type = 'character varying' THEN
    ALTER TABLE xinyu_messages ALTER COLUMN sender_user_id TYPE user_profile
    USING CASE WHEN sender_user_id IS NULL THEN NULL ELSE ROW(sender_user_id, '', '', '', '')::user_profile END;
    ALTER TABLE xinyu_messages ALTER COLUMN receiver_user_id TYPE user_profile
    USING CASE WHEN receiver_user_id IS NULL THEN NULL ELSE ROW(receiver_user_id, '', '', '', '')::user_profile END;
  END IF;
END$$;`,
  },
  {
    name: 'xinyu_broadcasts user_id type migration',
    sql: `DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type FROM information_schema.columns
  WHERE table_name = 'xinyu_broadcasts' AND column_name = 'target_user_id';
  IF col_type = 'character varying' THEN
    ALTER TABLE xinyu_broadcasts ALTER COLUMN target_user_id TYPE user_profile
    USING CASE WHEN target_user_id IS NULL THEN NULL ELSE ROW(target_user_id, '', '', '', '')::user_profile END;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'xinyu_broadcasts' AND column_name = 'user_id') THEN
      ALTER TABLE xinyu_broadcasts ADD COLUMN user_id user_profile;
      UPDATE xinyu_broadcasts SET user_id = ROW('', '', '', '', '')::user_profile WHERE user_id IS NULL;
      ALTER TABLE xinyu_broadcasts ALTER COLUMN user_id SET NOT NULL;
    END IF;
  END IF;
END$$;`,
  },
  {
    name: 'xinyu_recordings user_id type migration',
    sql: `DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type FROM information_schema.columns
  WHERE table_name = 'xinyu_recordings' AND column_name = 'user_id';
  IF col_type = 'character varying' THEN
    ALTER TABLE xinyu_recordings ALTER COLUMN user_id TYPE user_profile
    USING CASE WHEN user_id IS NULL THEN NULL ELSE ROW(user_id, '', '', '', '')::user_profile END;
  END IF;
END$$;`,
  },
  {
    name: 'xinyu_daily_data user_id type migration',
    sql: `DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type FROM information_schema.columns
  WHERE table_name = 'xinyu_daily_data' AND column_name = 'user_id';
  IF col_type = 'character varying' THEN
    ALTER TABLE xinyu_daily_data ALTER COLUMN user_id TYPE user_profile
    USING CASE WHEN user_id IS NULL THEN NULL ELSE ROW(user_id, '', '', '', '')::user_profile END;
  END IF;
END$$;`,
  },
  {
    name: 'xinyu_privacy_settings user_id type migration',
    sql: `DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type FROM information_schema.columns
  WHERE table_name = 'xinyu_privacy_settings' AND column_name = 'user_id';
  IF col_type = 'character varying' THEN
    ALTER TABLE xinyu_privacy_settings ALTER COLUMN user_id TYPE user_profile
    USING CASE WHEN user_id IS NULL THEN NULL ELSE ROW(user_id, '', '', '', '')::user_profile END;
  END IF;
END$$;`,
  },
  {
    name: 'xinyu_invite_codes user_id type migration',
    sql: `DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type FROM information_schema.columns
  WHERE table_name = 'xinyu_invite_codes' AND column_name = 'user_id';
  IF col_type = 'character varying' THEN
    ALTER TABLE xinyu_invite_codes ALTER COLUMN user_id TYPE user_profile
    USING CASE WHEN user_id IS NULL THEN NULL ELSE ROW(user_id, '', '', '', '')::user_profile END;
  END IF;
END$$;`,
  },
  {
    name: 'xinyu_language_samples user_id type migration',
    sql: `DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type FROM information_schema.columns
  WHERE table_name = 'xinyu_language_samples' AND column_name = 'user_id';
  IF col_type = 'character varying' THEN
    ALTER TABLE xinyu_language_samples ALTER COLUMN user_id TYPE user_profile
    USING CASE WHEN user_id IS NULL THEN NULL ELSE ROW(user_id, '', '', '', '')::user_profile END;
  END IF;
END$$;`,
  },
  {
    name: 'xinyu_audit_columns type migration',
    sql: `DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name LIKE 'xinyu_%'
      AND column_name IN ('_created_by', '_updated_by')
      AND data_type = 'character varying'
  LOOP
    EXECUTE format(
      'ALTER TABLE %I ALTER COLUMN %I TYPE user_profile USING CASE WHEN %I IS NULL THEN NULL ELSE ROW(%I, '''', '''', '''', '''')::user_profile END',
      rec.table_name, rec.column_name, rec.column_name, rec.column_name
    );
  END LOOP;
END$$;`,
  },
  {
    name: 'RLS enable and anon policy for all xinyu tables',
    sql: `DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename LIKE 'xinyu_%'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', rec.tablename);
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS %I ON %I AS PERMISSIVE FOR ALL TO anon USING (true) WITH CHECK (true)',
      'anon_all_policy_' || rec.tablename, rec.tablename
    );
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS %I ON %I AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      'authenticated_all_policy_' || rec.tablename, rec.tablename
    );
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
