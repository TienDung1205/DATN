import { AppError } from '../errors/appError.js';

export function invalidLogin(): AppError {
  return new AppError(401, 'Email hoặc mật khẩu không đúng.');
}

export function invalidSession(): AppError {
  return new AppError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
}
