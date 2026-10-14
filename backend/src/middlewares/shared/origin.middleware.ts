import cors from 'cors';
import type { RequestHandler } from 'express';
import { getFrontendOrigin, type AppConfig } from '../../config/env.js';
import { HTTP_STATUS, REQUEST_ID_HEADER } from '../../constants/http.js';
import { AppError } from '../../errors/appError.js';
import { getAppValue } from '../../utils/appContext.js';

export function createCors(config: AppConfig) {
  const frontendOrigin = getFrontendOrigin(config);

  return cors({
    origin(origin, callback) {
      if (!origin || origin === frontendOrigin) {
        callback(null, true);
        return;
      }

      const error = new AppError(HTTP_STATUS.FORBIDDEN, 'Nguồn truy cập không được phép.');
      callback(error);
    },
    credentials: true,
    exposedHeaders: [REQUEST_ID_HEADER],
  });
}

export const requireFrontendOrigin: RequestHandler = (req, _res, next) => {
  const config = getAppValue<AppConfig>(req.app, 'appConfig');
  const frontendOrigin = getFrontendOrigin(config);
  const requestOrigin = req.get('origin');

  if (requestOrigin !== frontendOrigin) {
    next(new AppError(HTTP_STATUS.FORBIDDEN, 'Nguồn yêu cầu xác thực không hợp lệ.'));
    return;
  }

  next();
};
