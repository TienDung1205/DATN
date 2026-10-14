import { rateLimit } from 'express-rate-limit';
import type { Application, Response } from 'express';
import type { UserAuthConfig } from '../../config/userAuth.js';
import type { ApiResponse } from '../../types/apiResponse.js';
import { getAppValue, perAppMiddleware } from '../../utils/appContext.js';

export function authRateLimit(windowSeconds: number, limit: number) {
  const windowMilliseconds = windowSeconds * 1000;

  return rateLimit({
    windowMs: windowMilliseconds,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res: Response<ApiResponse>, _next, options) => {
      res.status(options.statusCode).json({
        success: false,
        message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
      });
    },
  });
}

function createUserLoginLimit(app: Application) {
  const config = getAppValue<UserAuthConfig>(app, 'userAuthConfig');
  const windowSeconds = config.AUTH_RATE_LIMIT_WINDOW_SECONDS;
  const requestLimit = config.AUTH_LOGIN_RATE_LIMIT;

  return authRateLimit(windowSeconds, requestLimit);
}

export const userLoginLimit = perAppMiddleware(createUserLoginLimit);

function createUserRefreshLimit(app: Application) {
  const config = getAppValue<UserAuthConfig>(app, 'userAuthConfig');
  const windowSeconds = config.AUTH_RATE_LIMIT_WINDOW_SECONDS;
  const requestLimit = config.AUTH_REFRESH_RATE_LIMIT;

  return authRateLimit(windowSeconds, requestLimit);
}

export const userRefreshLimit = perAppMiddleware(createUserRefreshLimit);

export function initializeRateLimits(app: Application): void {
  if (app.locals.userAuthConfig) {
    userLoginLimit.initialize(app);
    userRefreshLimit.initialize(app);
  }
}
