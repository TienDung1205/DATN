import type { NextFunction, Request, Response } from 'express';
import type * as AuthDto from '../../dto/client/auth.dto.js';
import type * as AccountDto from '../../dto/client/account.dto.js';
import type { UserAuthService } from '../../services/client/auth/auth.service.js';
import type { UserAccountService } from '../../services/client/account.service.js';
import { getUserPrincipal } from '../../middlewares/client/auth.middleware.js';
import { getAppValue } from '../../utils/appContext.js';
import { clearCookie } from '../../utils/authCookies.js';

type ChangePasswordRequest = Request<Record<string, string>, AuthDto.ChangePasswordResponse, AuthDto.ChangePasswordInput>;
type UpdateProfileRequest = Request<Record<string, string>, AccountDto.UpdateProfileResponse, AccountDto.UpdateProfileInput>;

// [PATCH] /users/me
export const updateProfile = async (req: UpdateProfileRequest, res: Response<AccountDto.UpdateProfileResponse>, next: NextFunction) => {
  try {
    const accountService = getAppValue<UserAccountService>(req.app, 'userAccountService');
    const principal = getUserPrincipal(res);
    const profile = await accountService.updateProfile(principal, req.body);

    req.log.info({ event: 'user_profile_updated', userId: profile.id }, 'User profile updated');

    res.json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công.',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// [POST] /users/me/change-password
export const changePassword = async (req: ChangePasswordRequest, res: Response<AuthDto.ChangePasswordResponse>, next: NextFunction) => {
  try {
    const userAuthService = getAppValue<UserAuthService>(req.app, 'userAuthService');
    const principal = getUserPrincipal(res);
    await userAuthService.changePassword(principal, req.body);

    clearCookie(req, res, 'user');
    req.log.info({ event: 'user_password_changed', userId: principal.profile.id }, 'User sessions revoked');

    res.json({
      success: true,
      message: 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
