import * as adapterpg from '@prisma/adapter-pg';
import * as prismaClient from '../generated/prisma/client.js';
import type { DatabaseConfig } from './databaseConfig.js';

export function createDatabase(config: DatabaseConfig) {
  const adapter = new adapterpg.PrismaPg({
    connectionString: config.DATABASE_URL,
    max: config.DATABASE_POOL_MAX,
    connectionTimeoutMillis: config.DATABASE_TIMEOUT_MS,
    statement_timeout: config.DATABASE_TIMEOUT_MS,
    query_timeout: config.DATABASE_TIMEOUT_MS,
    idleTimeoutMillis: 10000,
  });
  const client = new prismaClient.PrismaClient({ adapter, log: [] });
  return {
    client,
    async check(): Promise<void> {
      await client.$queryRaw`SELECT 1 FROM users LIMIT 1`;
    },
    close: () => client.$disconnect(),
  };
}
