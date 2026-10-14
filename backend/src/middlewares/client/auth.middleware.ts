import type { RequestHandler, Response } from 'express';
import type { UserPrincipal } from '../../dto/client/auth.dto.js';
import type { UserAuthService } from '../../services/client/auth/auth.service.js';
import { AppError } from '../../errors/appError.js';
import { getAppValue } from '../../utils/appContext.js';

export function getUserPrincipal(res: Response): UserPrincipal {
  const principal = res.locals.user as UserPrincipal | undefined;

  if (!principal) {
    throw new AppError(401, 'Vui lòng đăng nhập.');
  }

  return principal;
}

export const authenticateUser: RequestHandler = async (req, res, next) => {
  try {
    const authorization = req.get('authorization') ?? '';
    const tokenMatch = authorization.match(/^Bearer (\S+)$/);
    const accessToken = tokenMatch?.[1];

    if (!accessToken) {
      throw new AppError(401, 'Vui lòng đăng nhập.');
    }

    const userAuthService = getAppValue<UserAuthService>(req.app, 'userAuthService');
    const principal = await userAuthService.authenticate(accessToken);

    res.locals.user = principal;
    next();
  } catch (error) {
    next(error);
  }
};
