import * as z from 'zod';

function isValidDatabaseUrl(value: string): boolean {
  if (value.includes('CHANGE_ME')) {
    return false;
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
    return false;
  }

  if (!url.hostname || !url.username) {
    return false;
  }

  if (url.pathname.length <= 1) {
    return false;
  }

  return true;
}

const databaseConfigSchema = z.object({
  DATABASE_URL: z.string().url().refine(isValidDatabaseUrl),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(5),
  DATABASE_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(100)
    .max(60000)
    .default(5000),
});

export type DatabaseConfig = z.output<typeof databaseConfigSchema>;

export function readDatabaseConfig(
  environment: NodeJS.ProcessEnv,
): DatabaseConfig {
  const validation = databaseConfigSchema.safeParse(environment);

  if (validation.success) {
    return validation.data;
  }

  const invalidFields = new Set<string>();

  for (const issue of validation.error.issues) {
    const fieldName = issue.path.join('.');
    invalidFields.add(fieldName);
  }

  const fieldNames = Array.from(invalidFields).join(', ');
  throw new Error(`Invalid database configuration: ${fieldNames}`);
}
