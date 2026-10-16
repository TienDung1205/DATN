import type { RequestHandler, Response } from 'express';
import type { AdminPrincipal } from '../../dto/admin/auth.dto.js';
import type { AdminAuthService } from '../../services/admin/auth/auth.service.js';
import { AppError } from '../../errors/appError.js';
import { getAppValue } from '../../utils/appContext.js';

export function getAdminPrincipal(res: Response): AdminPrincipal {
  const principal = res.locals.admin as AdminPrincipal | undefined;

  if (!principal) {
    throw new AppError(401, 'Vui lòng đăng nhập.');
  }

  return principal;
}

export const authenticateAdmin: RequestHandler = async (req, res, next) => {
  try {
    const authorization = req.get('authorization') ?? '';
    const tokenMatch = authorization.match(/^Bearer (\S+)$/);
    const accessToken = tokenMatch?.[1];

    if (!accessToken) {
      throw new AppError(401, 'Vui lòng đăng nhập.');
    }

    const adminAuthService = getAppValue<AdminAuthService>(req.app, 'adminAuthService');
    const principal = await adminAuthService.authenticate(accessToken);

    res.locals.admin = principal;
    next();
  } catch (error) {
    next(error);
  }
};
