import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { sql } from 'drizzle-orm';

const XINYU_TABLES = [
  'xinyu_users',
  'xinyu_bindings',
  'xinyu_invite_codes',
  'xinyu_broadcasts',
  'xinyu_daily_data',
  'xinyu_recordings',
  'xinyu_language_samples',
  'xinyu_messages',
  'xinyu_privacy_settings',
];

@Injectable()
export class RlsBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(RlsBootstrapService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('[RlsBootstrap] 启动时检查业务表 RLS 权限...');
      await this.ensureRolesExist();
      await this.ensureAnonAllPolicies();
      this.logger.log('[RlsBootstrap] RLS 权限检查完成');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[RlsBootstrap] RLS 权限修复失败: ${msg}`);
    }
  }

  private async ensureRolesExist(): Promise<void> {
    const roles = ['anon', 'authenticated'];
    for (const role of roles) {
      try {
        await this.db.execute(sql.raw(`DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${role}') THEN
    CREATE ROLE ${role} NOLOGIN;
  END IF;
END$$;`));
        this.logger.log(`[RlsBootstrap] 确认角色 ${role} 存在`);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`[RlsBootstrap] 无法创建角色 ${role}: ${msg}，将跳过该角色的 RLS 策略`);
      }
    }
  }

  private async ensureAnonAllPolicies(): Promise<void> {
    let rlsEnabledCount = 0;
    let policyFixedCount = 0;

    const anonExists = await this.roleExists('anon');
    const authExists = await this.roleExists('authenticated');

    if (!anonExists && !authExists) {
      this.logger.warn('[RlsBootstrap] anon 和 authenticated 角色均不存在，跳过策略创建（RLS 仍启用，表所有者可正常访问）');
    }

    for (const table of XINYU_TABLES) {
      try {
        const rlsEnabled = await this.isRlsEnabled(table);
        if (!rlsEnabled) {
          await this.db.execute(
            sql.raw(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`),
          );
          rlsEnabledCount += 1;
          this.logger.log(`[RlsBootstrap] 已启用 ${table} 的 RLS`);
        }

        const policyExists = await this.policyExists(table, '修改全部数据_anon');
        if (anonExists && !policyExists) {
          await this.db.execute(
            sql.raw(
              `CREATE POLICY "修改全部数据_anon" ON "${table}" `
                + 'AS PERMISSIVE FOR ALL TO anon USING (true) WITH CHECK (true);',
            ),
          );
          policyFixedCount += 1;
          this.logger.log(`[RlsBootstrap] 已创建 ${table} 的 anon ALL 权限策略`);
        }

        if (anonExists) {
          const grantExists = await this.roleHasTablePrivilege('anon', table, 'INSERT');
          if (!grantExists) {
            await this.db.execute(
              sql.raw(`GRANT ALL ON "${table}" TO anon;`),
            );
            this.logger.log(`[RlsBootstrap] 已授予 anon ${table} 的 ALL 表权限`);
          }
        }

        if (authExists) {
          const grantExists = await this.roleHasTablePrivilege('authenticated', table, 'INSERT');
          if (!grantExists) {
            await this.db.execute(
              sql.raw(`GRANT ALL ON "${table}" TO authenticated;`),
            );
            this.logger.log(`[RlsBootstrap] 已授予 authenticated ${table} 的 ALL 表权限`);
          }
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('already exists') || msg.includes('42710')) {
          continue;
        }
        this.logger.warn(`[RlsBootstrap] 修复 ${table} 权限失败: ${msg}`);
      }
    }

    this.logger.log(
      `[RlsBootstrap] 启用RLS ${rlsEnabledCount} 张表, `
        + `创建策略 ${policyFixedCount} 张, `
        + `共 ${XINYU_TABLES.length} 张业务表检查完毕`,
    );
  }

  private async isRlsEnabled(table: string): Promise<boolean> {
    const result = await this.db.execute(
      sql.raw(
        `SELECT relrowsecurity AS rls_enabled `
          + `FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace `
          + `WHERE n.nspname = 'public' AND c.relname = '${table}'`,
      ),
    );
    const rows = result as unknown as Array<{ rls_enabled: boolean }>;
    return rows.length > 0 && rows[0].rls_enabled === true;
  }

  private async roleExists(roleName: string): Promise<boolean> {
    const result = await this.db.execute(
      sql.raw(
        `SELECT 1::int as cnt FROM pg_catalog.pg_roles WHERE rolname = '${roleName}' LIMIT 1`,
      ),
    );
    const rows = result as unknown as Array<{ cnt: number }>;
    return rows.length > 0;
  }

  private async roleHasTablePrivilege(roleName: string, table: string, privilege: string): Promise<boolean> {
    const result = await this.db.execute(
      sql.raw(
        `SELECT has_table_privilege('${roleName}', '${table}', '${privilege}') AS has_priv`,
      ),
    );
    const rows = result as unknown as Array<{ has_priv: boolean }>;
    return rows.length > 0 && rows[0].has_priv === true;
  }

  private async policyExists(table: string, policyName: string): Promise<boolean> {
    const result = await this.db.execute(
      sql.raw(
        `SELECT count(*)::int as cnt FROM pg_policies `
          + `WHERE tablename = '${table}' AND policyname = '${policyName}'`,
      ),
    );
    const rows = result as unknown as Array<{ cnt: number }>;
    return rows.length > 0 && rows[0].cnt > 0;
  }
}
