import * as z from 'zod';

function createIntegerSchema(defaultValue: number, min: number, max: number) {
  const numberFromText = z.string().regex(/^\d+$/).transform(Number);
  const allowedInteger = z.number().int().min(min).max(max);

  return numberFromText.pipe(allowedInteger).default(defaultValue);
}

function isValidFrontendOrigin(value: string): boolean {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return false;
  }

  if (url.username || url.password) {
    return false;
  }

  if (url.pathname !== '/' || url.search || url.hash) {
    return false;
  }

  return true;
}

const frontendOriginSchema = z
  .url()
  .refine(isValidFrontendOrigin)
  .transform((value) => new URL(value).origin);

const appConfigSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  HOST: z.string().trim().min(1).default('127.0.0.1'),
  BACKEND_PORT: createIntegerSchema(8000, 1, 65_535),
  FRONTEND_PORT: createIntegerSchema(5173, 1, 65_535),
  FRONTEND_ORIGIN: frontendOriginSchema.optional(),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  BODY_LIMIT_BYTES: createIntegerSchema(102_400, 1, 10_485_760),
  SHUTDOWN_TIMEOUT_MS: createIntegerSchema(10_000, 100, 60_000),
});

export type AppConfig = z.output<typeof appConfigSchema>;

export function getFrontendOrigin(config: AppConfig): string {
  if (config.FRONTEND_ORIGIN !== undefined) {
    return config.FRONTEND_ORIGIN;
  }

  return `http://localhost:${config.FRONTEND_PORT}`;
}

export function readConfig(environment: NodeJS.ProcessEnv): AppConfig {
  const configValues = {
    ...environment,
    BACKEND_PORT: environment.BACKEND_PORT ?? environment.PORT,
  };

  const validation = appConfigSchema.safeParse(configValues);

  if (validation.success) {
    return validation.data;
  }

  const invalidFields = new Set<string>();

  for (const issue of validation.error.issues) {
    const fieldName = issue.path.join('.');
    invalidFields.add(fieldName);
  }

  const fieldNames = Array.from(invalidFields).join(', ');
  throw new Error(`Invalid environment configuration: ${fieldNames}`);
}
