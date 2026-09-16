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
      await this.ensureAnonAllPolicies();
      this.logger.log('[RlsBootstrap] RLS 权限检查完成');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[RlsBootstrap] RLS 权限修复失败: ${msg}`);
    }
  }

  private async ensureAnonAllPolicies(): Promise<void> {
    let fixedCount = 0;

    for (const table of XINYU_TABLES) {
      try {
        const exists = await this.policyExists(table, '修改全部数据_anon');
        if (exists) continue;

        await this.db.execute(
          sql.raw(
            `CREATE POLICY "修改全部数据_anon" ON "${table}" `
              + 'AS PERMISSIVE FOR ALL TO anon USING (true) WITH CHECK (true);',
          ),
        );
        fixedCount += 1;
        this.logger.log(`[RlsBootstrap] 已修复 ${table} 的 anon ALL 权限`);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('already exists') || msg.includes('42710')) {
          continue;
        }
        this.logger.warn(`[RlsBootstrap] 修复 ${table} 权限失败: ${msg}`);
      }
    }

    if (fixedCount > 0) {
      this.logger.log(`[RlsBootstrap] 共修复 ${fixedCount} 张表的 RLS 权限`);
    } else {
      this.logger.log('[RlsBootstrap] 所有业务表 RLS 权限正常');
    }
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
