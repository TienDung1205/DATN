import type { NextFunction, Request, Response } from 'express';
import type * as AuthDto from '../../dto/admin/auth.dto.js';
import type * as AccountDto from '../../dto/admin/account.dto.js';
import type { AdminAuthService } from '../../services/admin/auth/auth.service.js';
import type { AdminAccountService } from '../../services/admin/account.service.js';
import { getAdminPrincipal } from '../../middlewares/admin/auth.middleware.js';
import { getAppValue } from '../../utils/appContext.js';
import { clearCookie } from '../../utils/authCookies.js';

type ChangePasswordRequest = Request<Record<string, string>, AuthDto.ChangePasswordResponse, AuthDto.ChangePasswordInput>;
type UpdateProfileRequest = Request<Record<string, string>, AccountDto.UpdateProfileResponse, AccountDto.UpdateProfileInput>;

// [PATCH] /admin/me
export const updateProfile = async (req: UpdateProfileRequest, res: Response<AccountDto.UpdateProfileResponse>, next: NextFunction) => {
  try {
    const accountService = getAppValue<AdminAccountService>(req.app, 'adminAccountService');
    const principal = getAdminPrincipal(res);
    const profile = await accountService.updateProfile(principal, req.body);

    req.log.info({ event: 'admin_profile_updated', adminId: profile.id }, 'Admin profile updated');

    res.json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công.',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

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
