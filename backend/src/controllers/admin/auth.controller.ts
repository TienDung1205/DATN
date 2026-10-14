import type { NextFunction, Request, Response } from 'express';
import type * as AuthDto from '../../dto/admin/auth.dto.js';
import type { AdminAuthService } from '../../services/admin/auth/auth.service.js';
import { AppError } from '../../errors/appError.js';
import { getAppValue } from '../../utils/appContext.js';
import { clearCookie, readToken, setCookie } from '../../utils/adminAuthCookies.js';

type LoginRequest = Request<Record<string, string>, AuthDto.LoginResponse, AuthDto.LoginInput>;

// [POST] /admin/auth/login
export const login = async (req: LoginRequest, res: Response<AuthDto.LoginResponse>, next: NextFunction) => {
  try {
    const adminAuthService = getAppValue<AdminAuthService>(req.app, 'adminAuthService');
    const result = await adminAuthService.login(req.body);

    setCookie(req, res, result.refreshToken);
    req.log.info(
      { event: 'admin_login', adminId: result.data.admin.id },
      'Admin signed in',
    );

    res.json({
      success: true,
      message: 'Đăng nhập thành công.',
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// [POST] /admin/auth/refresh
export const refresh = async (req: Request, res: Response<AuthDto.RefreshResponse>, next: NextFunction) => {
  try {
    const adminAuthService = getAppValue<AdminAuthService>(req.app, 'adminAuthService');
    const token = readToken(req);

    if (!token) {
      clearCookie(req, res);
      throw new AppError(401, 'Vui lòng đăng nhập lại.');
    }

    const result = await adminAuthService.refresh(token);
    setCookie(req, res, result.refreshToken);

    res.json({
      success: true,
      message: 'Đã làm mới phiên đăng nhập.',
      data: result.data,
    });
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 401) {
      clearCookie(req, res);
    }

    next(error);
  }
};
