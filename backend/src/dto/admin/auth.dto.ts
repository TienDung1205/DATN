import type { AccountStatus, AdminRole } from '../../generated/prisma/client.js';
import type { ApiResponse } from '../../types/apiResponse.js';

export interface LoginInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type ChangePasswordOutput = null;
export type ChangePasswordResponse = ApiResponse<ChangePasswordOutput>;

export interface AdminPrincipal {
  adminId: bigint;
  sessionId: bigint;
  profile: AdminOutput;
}

export interface AdminOutput {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: AccountStatus;
  role: AdminRole;
}

export interface AuthSessionOutput {
  accessToken: string;
  expiresIn: number;
  admin: AdminOutput;
}

export interface AdminSessionResult {
  refreshToken: string;
  data: AuthSessionOutput;
}

export type LoginResponse = ApiResponse<AuthSessionOutput>;
export type RefreshResponse = ApiResponse<AuthSessionOutput>;
