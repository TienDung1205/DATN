import * as z from 'zod';

const MIN_ACCESS_TOKEN_SECRET_BYTES = 32;

const adminAuthConfigSchema = z.object({
  ADMIN_ACCESS_TOKEN_SECRET: z.string().refine((value) => Buffer.byteLength(value, 'utf8') >= MIN_ACCESS_TOKEN_SECRET_BYTES),
  AUTH_ISSUER: z.string().trim().min(1).default('bookstore-api'),
  ADMIN_ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(1).max(3600).default(900),
  ADMIN_REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().min(1).max(2592000).default(604800),
  ADMIN_COOKIE_SECURE: z.enum(['true', 'false']).transform((value) => value === 'true'),
  AUTH_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().min(1).max(3600).default(900),
  ADMIN_LOGIN_RATE_LIMIT: z.coerce.number().int().min(1).max(1000).default(10),
  ADMIN_REFRESH_RATE_LIMIT: z.coerce.number().int().min(1).max(1000).default(60),
});

export type AdminAuthConfig = z.output<typeof adminAuthConfigSchema>;

export function readAdminAuthConfig(environment: NodeJS.ProcessEnv): AdminAuthConfig {
  const validation = adminAuthConfigSchema.safeParse({
    ...environment,
    ADMIN_COOKIE_SECURE: environment.ADMIN_COOKIE_SECURE ?? String(environment.NODE_ENV === 'production'),
  });

  if (!validation.success) {
    const fields = new Set(validation.error.issues.map((issue) => issue.path.join('.')));
    throw new Error(`Invalid environment configuration: ${Array.from(fields).join(', ')}`);
  }

  if (validation.data.ADMIN_ACCESS_TOKEN_SECRET === environment.USER_ACCESS_TOKEN_SECRET) {
    throw new Error('Invalid environment configuration: ADMIN_ACCESS_TOKEN_SECRET must differ from USER_ACCESS_TOKEN_SECRET');
  }

  return validation.data;
}

export const ADMIN_COOKIE = 'admin_refresh_token';
export const ADMIN_COOKIE_PATH = '/admin/auth';
