import argon2 from 'argon2';
import * as z from 'zod';

export const strongPasswordSchema = z
  .string()
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/,
    'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt!',
  )
  .max(128, 'Mật khẩu không hợp lệ.');

export const changePasswordSchema = z.strictObject({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại.').max(128, 'Mật khẩu không hợp lệ.'),
  newPassword: strongPasswordSchema,
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới.').max(128, 'Mật khẩu không hợp lệ.'),
}).refine((value) => value.currentPassword !== value.newPassword, {
  path: ['newPassword'],
  message: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
}).refine((value) => value.newPassword === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Hai mật khẩu chưa khớp.',
});

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}
