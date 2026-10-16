import type { NextFunction, Request, Response } from 'express';
import type * as AuthDto from '../../dto/admin/auth.dto.js';
import type { AdminAuthService } from '../../services/admin/auth/auth.service.js';
import { getAdminPrincipal } from '../../middlewares/admin/auth.middleware.js';
import { getAppValue } from '../../utils/appContext.js';
import { clearCookie } from '../../utils/authCookies.js';

type ChangePasswordRequest = Request<Record<string, string>, AuthDto.ChangePasswordResponse, AuthDto.ChangePasswordInput>;

// [POST] /admin/me/change-password
export const changePassword = async (req: ChangePasswordRequest, res: Response<AuthDto.ChangePasswordResponse>, next: NextFunction) => {
  try {
    const adminAuthService = getAppValue<AdminAuthService>(req.app, 'adminAuthService');
    const principal = getAdminPrincipal(res);
    await adminAuthService.changePassword(principal, req.body);

    clearCookie(req, res, 'admin');
    req.log.info({ event: 'admin_password_changed', adminId: principal.profile.id }, 'Admin sessions revoked');

    res.json({
      success: true,
      message: 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
