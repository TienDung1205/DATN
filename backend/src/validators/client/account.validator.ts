import * as z from 'zod';
import type { UpdateProfileInput } from '../../dto/client/account.dto.js';

function skipEmptyField(value: unknown): unknown {
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
}

export const updateProfileSchema: z.ZodType<UpdateProfileInput> = z.strictObject({
  fullName: z.preprocess(skipEmptyField, z.string().trim().min(1, 'Vui lòng nhập họ tên.').max(120, 'Họ tên không được quá 120 ký tự.').optional()),
  phone: z.preprocess(skipEmptyField, z.string().trim().regex(/^\+?[0-9]{9,15}$/, 'Số điện thoại phải có 9–15 chữ số, có thể bắt đầu bằng +.').nullable().optional()),
  avatar: z.preprocess(skipEmptyField, z.string().trim().max(2048, 'URL ảnh đại diện quá dài.').pipe(z.url({ protocol: /^https?$/, error: 'Ảnh đại diện phải là URL HTTP hoặc HTTPS hợp lệ.' })).nullable().optional()),
});
