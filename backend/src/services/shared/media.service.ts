import { randomUUID } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import type { Logger } from 'pino';
import type { MediaConfig } from '../../config/media.js';
import { AppError } from '../../errors/appError.js';

const AVATAR_SIZE = 512;
const WEBP_QUALITY = 80;
const MAX_IMAGE_PIXELS = 25_000_000;
const IMAGE_PROCESSING_SECONDS = 10;
const CLEANUP_TIMEOUT_MS = 5000;
const IMAGE_FORMATS = new Set(['jpeg', 'png', 'webp']);

export interface StoredImage {
  url: string;
  publicId: string;
}

export interface MediaService {
  uploadAvatar: (buffer: Buffer, userId: bigint) => Promise<StoredImage>;
  removeAvatar: (url: string | null, userId: bigint) => Promise<void>;
  remove: (publicId: string) => Promise<void>;
}

export function createMediaService(config: MediaConfig, logger: Logger): MediaService {
  let activeUploads = 0;
  const options = {
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
    timeout: config.IMAGE_UPLOAD_TIMEOUT_MS,
    resource_type: 'image' as const,
  };

  async function uploadAvatar(buffer: Buffer, userId: bigint): Promise<StoredImage> {
    if (activeUploads >= config.IMAGE_UPLOAD_CONCURRENCY) {
      throw new AppError(429, 'Đang có nhiều ảnh được xử lý. Vui lòng thử lại sau.');
    }

    activeUploads += 1;
    try {
      return await processAvatar(buffer, userId);
    } finally {
      activeUploads -= 1;
    }
  }

  async function processAvatar(buffer: Buffer, userId: bigint): Promise<StoredImage> {
    if (!config.CLOUDINARY_API_SECRET) {
      throw new AppError(503, 'Dịch vụ lưu ảnh chưa sẵn sàng.');
    }
    if (!buffer.length || buffer.length > config.IMAGE_MAX_BYTES) {
      throw new AppError(413, 'Ảnh vượt quá giới hạn dung lượng.');
    }

    let optimized: Buffer;
    try {
      const image = sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: 'warning' });
      const metadata = await image.metadata();
      if (!metadata.format || !IMAGE_FORMATS.has(metadata.format) || (metadata.pages ?? 1) > 1) {
        throw new Error('Unsupported image');
      }
      optimized = await image.rotate().resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'inside', withoutEnlargement: true }).webp({ quality: WEBP_QUALITY }).timeout({ seconds: IMAGE_PROCESSING_SECONDS }).toBuffer();
    } catch {
      throw new AppError(400, 'Ảnh không hợp lệ. Hãy chọn JPEG, PNG hoặc WebP tĩnh, tối đa 25 triệu pixel.');
    }

    const publicId = `${config.CLOUDINARY_FOLDER}/avatars/${userId}/${randomUUID()}`;
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ ...options, public_id: publicId, overwrite: false, format: 'webp' }, (error, result) => {
        if (error || !result?.secure_url || result.public_id !== publicId || readAvatarPublicId(result.secure_url, userId) !== publicId) {
          logger.warn({ event: 'image_upload_failed', publicId }, 'Image upload failed; check for an orphan asset before retrying cleanup');
          reject(new AppError(502, 'Không thể tải ảnh lên dịch vụ lưu trữ.'));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      });
      stream.on('error', () => reject(new AppError(502, 'Không thể tải ảnh lên dịch vụ lưu trữ.')));
      stream.end(optimized);
    });
  }

  async function remove(publicId: string): Promise<void> {
    try {
      if (!config.CLOUDINARY_API_SECRET) throw new Error('Storage not configured');
      const cleanupOptions = { ...options, timeout: Math.min(CLEANUP_TIMEOUT_MS, config.IMAGE_UPLOAD_TIMEOUT_MS), invalidate: true };
      const result = await cloudinary.uploader.destroy(publicId, cleanupOptions);
      if (result.result !== 'ok' && result.result !== 'not found') throw new Error('Deletion failed');
    } catch {
      logger.warn({ event: 'image_cleanup_failed', publicId }, 'Retry deletion of this unused asset in Cloudinary');
    }
  }

  function readAvatarPublicId(value: string, userId: bigint): string | null {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return null;
    }

    if (url.protocol !== 'https:' || url.host !== 'res.cloudinary.com' || url.username || url.password || url.search || url.hash) {
      return null;
    }

    const parts = url.pathname.split('/');
    if (parts.length !== 9 || parts[1] !== config.CLOUDINARY_CLOUD_NAME || parts[2] !== 'image' || parts[3] !== 'upload') {
      return null;
    }
    if (!/^v[0-9]+$/.test(parts[4]!) || parts[5] !== config.CLOUDINARY_FOLDER || parts[6] !== 'avatars' || parts[7] !== userId.toString()) {
      return null;
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/.test(parts[8]!)) {
      return null;
    }

    return parts.slice(5).join('/').slice(0, -'.webp'.length);
  }

  async function removeAvatar(url: string | null, userId: bigint): Promise<void> {
    if (!url) return;
    const publicId = readAvatarPublicId(url, userId);
    if (publicId) await remove(publicId);
  }

  return { uploadAvatar, removeAvatar, remove };
}
