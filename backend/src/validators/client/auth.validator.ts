import * as z from 'zod';
import type { ChangePasswordInput, LoginInput, RegisterInput } from '../../dto/client/auth.dto.js';
import * as passwordUtils from '../../utils/password.js';

export const loginSchema: z.ZodType<LoginInput> = z.strictObject({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.').max(128, 'Mật khẩu không hợp lệ.'),
});

export const changePasswordSchema: z.ZodType<ChangePasswordInput> = passwordUtils.changePasswordSchema;

const name = z.string().trim().min(1).max(120);
const phone = z
  .string()
  .trim()
  .regex(
    /^\+?[0-9]{9,15}$/,
    'Số điện thoại phải có 9–15 chữ số, có thể bắt đầu bằng +.',
  );

export const registerSchema: z.ZodType<RegisterInput> = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
    phone,
    password: passwordUtils.strongPasswordSchema,
    confirmPassword: z.string(),
    fullName: name,
  })
  .strict()
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Hai mật khẩu chưa khớp.',
  });
