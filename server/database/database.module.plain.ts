import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
// eslint-disable-next-line import/no-extraneous-dependencies
import postgres from 'postgres';
import * as schema from './schema';

export const DB = 'DB';
export type DbInstance = PostgresJsDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: DB,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): DbInstance => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        if (!databaseUrl) {
          throw new Error('DATABASE_URL environment variable is required');
        }
        const queryClient = postgres(databaseUrl);
        return drizzle(queryClient, { schema });
      },
    },
  ],
  exports: [DB],
})
export class DatabaseModule {}
