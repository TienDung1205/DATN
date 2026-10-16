import multer from 'multer';
import type { RequestHandler } from 'express';
import type { MediaConfig } from '../../config/media.js';
import { AppError } from '../../errors/appError.js';
import { getAppValue, perAppMiddleware } from '../../utils/appContext.js';
import { userUploadLimit } from './rateLimit.middleware.js';

const ACCEPTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const parseMultipartProfile = perAppMiddleware((app): RequestHandler => {
  const config = getAppValue<MediaConfig>(app, 'mediaConfig');
  let activeUploads = 0;
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.IMAGE_MAX_BYTES, files: 1, fields: 3, parts: 4, fieldSize: 2048 },
    fileFilter: (_req, file, callback) => {
      if (!ACCEPTED_MIME_TYPES.has(file.mimetype)) {
        callback(new AppError(400, 'Ảnh phải có định dạng JPEG, PNG hoặc WebP.'));
        return;
      }
      callback(null, true);
    },
  }).single('image');

  return (req, res, next) => {
    if (activeUploads >= config.IMAGE_UPLOAD_CONCURRENCY) return next(new AppError(429, 'Đang có nhiều ảnh được xử lý. Vui lòng thử lại sau.'));

    activeUploads += 1;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      activeUploads -= 1;
    };
    res.once('finish', release);
    res.once('close', release);

    upload(req, res, (error: unknown) => {
      if (error instanceof multer.MulterError) {
        const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        next(new AppError(status, 'Chỉ gửi một ảnh trong trường image, trong giới hạn dung lượng.'));
        return;
      }
      if (error) return next(new AppError(400, 'Dữ liệu upload ảnh không hợp lệ.'));
      if (req.file && !config.CLOUDINARY_API_SECRET) return next(new AppError(503, 'Dịch vụ lưu ảnh chưa sẵn sàng.'));
      for (const field of ['phone', 'avatar']) {
        if (req.body?.[field] === 'null') req.body[field] = null;
      }
      req.body ??= {};
      next();
    });
  };
});

export const parseProfileBody: RequestHandler = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    userUploadLimit(req, res, (error?: unknown) => {
      if (error) return next(error);
      parseMultipartProfile(req, res, next);
    });
    return;
  }
  if (req.get('content-type') && !req.is('application/json')) {
    next(new AppError(415, 'Hãy gửi JSON hoặc multipart/form-data.'));
    return;
  }
  req.body ??= {};
  next();
};
