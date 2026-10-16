import * as z from 'zod';
import type { UpdateProfileInput } from '../../dto/client/account.dto.js';

export const updateProfileSchema: z.ZodType<UpdateProfileInput> = z.strictObject({
  fullName: z.string().trim().min(1, 'Vui lòng nhập họ tên.').max(120, 'Họ tên không được quá 120 ký tự.').optional(),
  phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/, 'Số điện thoại phải có 9–15 chữ số, có thể bắt đầu bằng +.').nullable().optional(),
  avatar: z.string().trim().max(2048, 'URL ảnh đại diện quá dài.').pipe(z.url({ protocol: /^https?$/, error: 'Ảnh đại diện phải là URL HTTP hoặc HTTPS hợp lệ.' })).nullable().optional(),
}).refine((value) => Object.values(value).some((field) => field !== undefined), {
  message: 'Chưa có thông tin cần cập nhật.',
});
