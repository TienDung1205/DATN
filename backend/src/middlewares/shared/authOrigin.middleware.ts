import type { RequestHandler } from 'express';
import { AppError } from '../../errors/appError.js';
import { getFrontendOrigin } from '../../config/env.js';
import type { AppConfig } from '../../config/env.js';
import { getAppValue } from '../../utils/appContext.js';

export function requireAuthOrigin(origin: string): RequestHandler {
  return (req, _res, next) => {
    const requestOrigin = req.get('origin');

    if (requestOrigin !== origin) {
      throw new AppError(403, 'Nguồn yêu cầu xác thực không hợp lệ.');
    }

    next();
  };
}

export const requireFrontendOrigin: RequestHandler = (req, res, next) => {
  const config = getAppValue<AppConfig>(req.app, 'appConfig');
  const frontendOrigin = getFrontendOrigin(config);
  const checkOrigin = requireAuthOrigin(frontendOrigin);

  return checkOrigin(req, res, next);
};
