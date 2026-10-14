import type { NextFunction, Request, Response } from 'express';
import type * as AuthDto from '../../dto/client/auth.dto.js';
import type { UserAuthService } from '../../services/client/auth/auth.service.js';
import { AppError } from '../../errors/appError.js';
import { getUserPrincipal } from '../../middlewares/client/auth.middleware.js';
import { getAppValue } from '../../utils/appContext.js';
import { clearCookie, readToken, setCookie } from '../../utils/authCookies.js';

type RegisterRequest = Request<Record<string, string>, AuthDto.RegisterResponse, AuthDto.RegisterInput>;
type LoginRequest = Request<Record<string, string>, AuthDto.LoginResponse, AuthDto.LoginInput>;

// [POST] /auth/register
export const register = async (req: RegisterRequest, res: Response<AuthDto.RegisterResponse>, next: NextFunction) => {
  try {
    const userAuthService = getAppValue<UserAuthService>(req.app, 'userAuthService');
    const result = await userAuthService.register(req.body);

    setCookie(req, res, result.refreshToken, 'user');

    req.log.info({ event: 'user_registered', userId: result.data.user.id }, 'Customer registered');

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công.',
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// [POST] /auth/login
export const login = async (req: LoginRequest, res: Response<AuthDto.LoginResponse>, next: NextFunction) => {
  try {
    const userAuthService = getAppValue<UserAuthService>(req.app, 'userAuthService');
    const result = await userAuthService.login(req.body);

    setCookie(req, res, result.refreshToken, 'user');
    req.log.info({ event: 'user_login', userId: result.data.user.id }, 'User signed in');

    res.json({
      success: true,
      message: 'Đăng nhập thành công.',
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// [POST] /auth/refresh
export const refresh = async (req: Request, res: Response<AuthDto.RefreshResponse>, next: NextFunction) => {
  try {
    const userAuthService = getAppValue<UserAuthService>(req.app, 'userAuthService');
    const token = readToken(req, 'user');

    if (!token) {
      clearCookie(req, res, 'user');
      throw new AppError(401, 'Vui lòng đăng nhập lại.');
    }

    const result = await userAuthService.refresh(token);
    setCookie(req, res, result.refreshToken, 'user');

    res.json({
      success: true,
      message: 'Đã làm mới phiên đăng nhập.',
      data: result.data,
    });
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 401) {
      clearCookie(req, res, 'user');
    }

    next(error);
  }
};

// [POST] /auth/logout
export const logout = async (req: Request, res: Response<AuthDto.LogoutResponse>, next: NextFunction) => {
  try {
    const userAuthService = getAppValue<UserAuthService>(req.app, 'userAuthService');
    await userAuthService.logout(readToken(req, 'user'));
    clearCookie(req, res, 'user');

    res.json({
      success: true,
      message: 'Đã đăng xuất.',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /auth/me
export const me = async (_req: Request, res: Response<AuthDto.MeResponse>, next: NextFunction) => {
  try {
    const user = getUserPrincipal(res);

    res.json({
      success: true,
      message: 'Thông tin tài khoản.',
      data: user.profile,
    });
  } catch (error) {
    next(error);
  }
};
