import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
// eslint-disable-next-line import/no-extraneous-dependencies
import postgres from 'postgres';
import * as schema from './schema';

export const DB = 'DB';
export const DRIZZLE_DATABASE = 'DRIZZLE_DATABASE';
export type DbInstance = PostgresJsDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: DB,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): DbInstance => {
        const databaseUrl =
          configService.get<string>('DATABASE_URL') ??
          configService.get<string>('SUDA_DATABASE_URL');
        if (!databaseUrl) {
          throw new Error(
            'DATABASE_URL or SUDA_DATABASE_URL environment variable is required',
          );
        }
        const queryClient = postgres(databaseUrl, { max: 10 });
        return drizzle(queryClient, { schema });
      },
    },
    {
      provide: DRIZZLE_DATABASE,
      useExisting: DB,
    },
  ],
  exports: [DB, DRIZZLE_DATABASE],
})
export class DatabaseModule {}
