import * as z from 'zod';

const userAuthConfigSchema = z.object({
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
});

export type UserAuthConfig = z.output<typeof userAuthConfigSchema>;

export function readUserAuthConfig(
  environment: NodeJS.ProcessEnv,
): UserAuthConfig {
  const validation = userAuthConfigSchema.safeParse(environment);

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
