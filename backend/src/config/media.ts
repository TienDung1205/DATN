import * as z from 'zod';

const schema = z.object({
  CLOUDINARY_CLOUD_NAME: z.string().trim().default(''),
  CLOUDINARY_API_KEY: z.string().trim().default(''),
  CLOUDINARY_API_SECRET: z.string().trim().default(''),
  CLOUDINARY_FOLDER: z.string().trim().regex(/^[a-zA-Z0-9_-]+$/).default('datn'),
  IMAGE_MAX_BYTES: z.coerce.number().int().min(100_000).max(10_485_760).default(5_242_880),
  IMAGE_UPLOAD_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120_000).default(30_000),
  IMAGE_UPLOAD_CONCURRENCY: z.coerce.number().int().min(1).max(10).default(3),
});

export type MediaConfig = z.output<typeof schema>;

export function readMediaConfig(environment: NodeJS.ProcessEnv): MediaConfig {
  const result = schema.safeParse(environment);

  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))];
    throw new Error(`Invalid media configuration: ${fields.join(', ')}`);
  }

  const config = result.data;
  const supplied = [config.CLOUDINARY_CLOUD_NAME, config.CLOUDINARY_API_KEY, config.CLOUDINARY_API_SECRET].filter(Boolean).length;

  if (supplied !== 0 && supplied !== 3) {
    throw new Error('Set all CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET or leave all empty.');
  }

  return config;
}
