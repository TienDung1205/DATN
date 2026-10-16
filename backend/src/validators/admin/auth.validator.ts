import * as z from 'zod';
import type { ChangePasswordInput, LoginInput } from '../../dto/admin/auth.dto.js';
import * as passwordUtils from '../../utils/password.js';

export const changePasswordSchema: z.ZodType<ChangePasswordInput> = passwordUtils.changePasswordSchema;

export const loginSchema: z.ZodType<LoginInput> = z.strictObject({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.').max(128, 'Mật khẩu không hợp lệ.'),
});
