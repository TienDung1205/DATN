import type { Request, Response, NextFunction } from 'express';
import type { RegisterInput, RegisterResponse } from '../../dto/client/auth.dto.js';
import type { UserAuthService } from '../../services/client/auth/auth.service.js';
import { getAppValue } from '../../utils/appContext.js';

type RegisterRequest = Request<Record<string, string>, RegisterResponse, RegisterInput>;

// [POST] /api/v1/auth/register
export const register = async (
  req: RegisterRequest,
  res: Response<RegisterResponse>,
  next: NextFunction,
) => {
  try {
    const userAuthService = getAppValue<UserAuthService>(
      req.app,
      'userAuthService',
    );

    const user = await userAuthService.register(req.body);

    req.log.info(
      { event: 'user_registered', userId: user.id },
      'Customer registered',
    );

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công. Vui lòng đăng nhập.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
