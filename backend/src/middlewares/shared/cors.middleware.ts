import cors from 'cors';
import { getFrontendOrigin } from '../../config/env.js';
import type { AppConfig } from '../../config/env.js';
import { HTTP_STATUS, REQUEST_ID_HEADER } from '../../constants/http.js';
import { AppError } from '../../errors/appError.js';

export function createCors(config: AppConfig) {
  const frontendOrigin = getFrontendOrigin(config);

  return cors({
    origin(origin, callback) {
      if (!origin || origin === frontendOrigin) {
        callback(null, true);
        return;
      }

      const error = new AppError(
        HTTP_STATUS.FORBIDDEN,
        'Nguồn truy cập không được phép.',
      );

      callback(error);
    },
    credentials: true,
    exposedHeaders: [REQUEST_ID_HEADER],
  });
}
