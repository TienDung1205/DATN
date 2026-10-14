import * as z from 'zod';

const userAuthConfigSchema = z.object({
  USER_ACCESS_TOKEN_SECRET: z.string().regex(/^[a-fA-F0-9]{64}$/),
  AUTH_ISSUER: z.string().trim().min(1).default('bookstore-api'),
  USER_ACCESS_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(1)
    .max(3600)
    .default(900),
  USER_REFRESH_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(1)
    .max(2592000)
    .default(604800),
  USER_COOKIE_SECURE: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true'),
  AUTH_RATE_LIMIT_WINDOW_SECONDS: z.coerce
    .number()
    .int()
    .min(1)
    .max(3600)
    .default(900),
  AUTH_LOGIN_RATE_LIMIT: z.coerce
    .number()
    .int()
    .min(1)
    .max(1000)
    .default(10),
  AUTH_REFRESH_RATE_LIMIT: z.coerce
    .number()
    .int()
    .min(1)
    .max(1000)
    .default(60),
});

export type UserAuthConfig = z.output<typeof userAuthConfigSchema>;

export function readUserAuthConfig(
  environment: NodeJS.ProcessEnv,
): UserAuthConfig {
  const defaultSecureCookie = environment.NODE_ENV === 'production';
  const configValues = {
    ...environment,
    USER_COOKIE_SECURE:
      environment.USER_COOKIE_SECURE ?? String(defaultSecureCookie),
  };

  const validation = userAuthConfigSchema.safeParse(configValues);

  if (validation.success) {
    const config = validation.data;
    const userSecret = config.USER_ACCESS_TOKEN_SECRET.toLowerCase();
    const adminSecret = environment.ADMIN_ACCESS_TOKEN_SECRET?.toLowerCase();

    if (userSecret === adminSecret) {
      throw new Error(
        'Invalid environment configuration: USER_ACCESS_TOKEN_SECRET must differ from ADMIN_ACCESS_TOKEN_SECRET',
      );
    }

    return config;
  }

  const invalidFields = new Set<string>();

  for (const issue of validation.error.issues) {
    const fieldName = issue.path.join('.');
    invalidFields.add(fieldName);
  }

  const fieldNames = Array.from(invalidFields).join(', ');
  throw new Error(`Invalid environment configuration: ${fieldNames}`);
}

export const USER_COOKIE = 'user_refresh_token';
export const USER_COOKIE_PATH = '/auth';
