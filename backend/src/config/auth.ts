import * as z from 'zod';

const MIN_ACCESS_TOKEN_SECRET_BYTES = 32;

const secretSchema = z.string().refine((value) => Buffer.byteLength(value, 'utf8') >= MIN_ACCESS_TOKEN_SECRET_BYTES);
const accessTokenTtlSchema = z.coerce.number().int().min(1).max(3600).default(900);
const refreshTokenTtlSchema = z.coerce.number().int().min(1).max(2592000).default(604800);
const secureCookieSchema = z.enum(['true', 'false']).transform((value) => value === 'true');
const requestLimitSchema = z.coerce.number().int().min(1).max(1000);

const sharedAuthConfigSchema = z.object({
  AUTH_ISSUER: z.string().trim().min(1).default('bookstore-api'),
  AUTH_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().min(1).max(3600).default(900),
});

const userAuthConfigSchema = sharedAuthConfigSchema.extend({
  USER_ACCESS_TOKEN_SECRET: secretSchema,
  USER_ACCESS_TOKEN_TTL_SECONDS: accessTokenTtlSchema,
  USER_REFRESH_TOKEN_TTL_SECONDS: refreshTokenTtlSchema,
  USER_COOKIE_SECURE: secureCookieSchema,
  AUTH_LOGIN_RATE_LIMIT: requestLimitSchema.default(10),
  AUTH_REFRESH_RATE_LIMIT: requestLimitSchema.default(60),
});

const adminAuthConfigSchema = sharedAuthConfigSchema.extend({
  ADMIN_ACCESS_TOKEN_SECRET: secretSchema,
  ADMIN_ACCESS_TOKEN_TTL_SECONDS: accessTokenTtlSchema,
  ADMIN_REFRESH_TOKEN_TTL_SECONDS: refreshTokenTtlSchema,
  ADMIN_COOKIE_SECURE: secureCookieSchema,
  ADMIN_LOGIN_RATE_LIMIT: requestLimitSchema.default(10),
  ADMIN_REFRESH_RATE_LIMIT: requestLimitSchema.default(60),
});

export type UserAuthConfig = z.output<typeof userAuthConfigSchema>;
export type AdminAuthConfig = z.output<typeof adminAuthConfigSchema>;

export function readUserAuthConfig(environment: NodeJS.ProcessEnv): UserAuthConfig {
  return readAuthConfig(userAuthConfigSchema, environment);
}

export function readAdminAuthConfig(environment: NodeJS.ProcessEnv): AdminAuthConfig {
  return readAuthConfig(adminAuthConfigSchema, environment);
}

function readAuthConfig<T>(schema: z.ZodType<T>, environment: NodeJS.ProcessEnv): T {
  const defaultSecureCookie = String(environment.NODE_ENV === 'production');
  const configValues = {
    ...environment,
    USER_COOKIE_SECURE: environment.USER_COOKIE_SECURE ?? defaultSecureCookie,
    ADMIN_COOKIE_SECURE: environment.ADMIN_COOKIE_SECURE ?? defaultSecureCookie,
  };
  const validation = schema.safeParse(configValues);

  if (!validation.success) {
    const invalidFields = new Set<string>();

    for (const issue of validation.error.issues) {
      invalidFields.add(issue.path.join('.'));
    }

    const fieldNames = Array.from(invalidFields).join(', ');
    throw new Error(`Invalid environment configuration: ${fieldNames}`);
  }

  const userSecret = environment.USER_ACCESS_TOKEN_SECRET;
  const adminSecret = environment.ADMIN_ACCESS_TOKEN_SECRET;

  if (userSecret !== undefined && userSecret === adminSecret) {
    throw new Error('Invalid environment configuration: USER_ACCESS_TOKEN_SECRET must differ from ADMIN_ACCESS_TOKEN_SECRET');
  }

  return validation.data;
}

export const USER_COOKIE = 'user_refresh_token';
export const USER_COOKIE_PATH = '/auth';
export const ADMIN_COOKIE = 'admin_refresh_token';
export const ADMIN_COOKIE_PATH = '/admin/auth';
