import * as z from 'zod';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { PrismaClient } from '../generated/prisma/client.js';
import { createDatabase, readDatabaseConfig } from '../config/database.js';
import { hashPassword, strongPasswordSchema } from '../utils/password.js';

const SEED_LOCK_ID = 186003;
const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));
const seedSchema = z.object({
  SEED_ADMIN_EMAIL: emailSchema,
  SEED_ADMIN_PASSWORD: strongPasswordSchema,
  SEED_ADMIN_FULL_NAME: z.string().trim().min(1).max(120),
});

type SeedResult = 'skipped' | 'exists' | 'created';

export async function seedAdmin(client: PrismaClient, environment: NodeJS.ProcessEnv): Promise<SeedResult> {
  const values = [environment.SEED_ADMIN_EMAIL, environment.SEED_ADMIN_PASSWORD, environment.SEED_ADMIN_FULL_NAME];

  if (values.every((value) => !value?.trim())) {
    return 'skipped';
  }

  const email = emailSchema.safeParse(environment.SEED_ADMIN_EMAIL);

  if (!email.success) {
    throw new Error('Check seed configuration: SEED_ADMIN_EMAIL must be a valid email.');
  }

  return client.$transaction(async (transaction) => {
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(${SEED_LOCK_ID}::bigint)`;
    const existingAdmin = await transaction.admin.findUnique({ where: { email: email.data } });

    if (existingAdmin) {
      return 'exists';
    }

    const input = seedSchema.safeParse(environment);

    if (!input.success) {
      const errors = input.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      throw new Error(`Check seed configuration: ${errors.join('; ')}`);
    }

    const password = await hashPassword(input.data.SEED_ADMIN_PASSWORD);
    await transaction.admin.create({
      data: {
        email: input.data.SEED_ADMIN_EMAIL,
        password,
        fullName: input.data.SEED_ADMIN_FULL_NAME,
        role: 'MANAGER',
      },
    });

    return 'created';
  });
}

async function main(): Promise<void> {
  const database = createDatabase(readDatabaseConfig(process.env));

  try {
    const result = await seedAdmin(database.client, process.env);
    const messages: Record<SeedResult, string> = {
      skipped: 'Admin seed skipped: all seed settings are empty.',
      exists: 'Admin email already exists; no account was changed.',
      created: 'Manager account created.',
    };
    console.log(messages[result]);
  } finally {
    await database.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    if (error instanceof Error && error.message.startsWith('Check seed configuration:')) {
      console.error(error.message);
    } else {
      console.error('Could not seed the manager. Check the database and migrations.');
    }

    process.exitCode = 1;
  });
}
