import type { AccountStatus } from '../../generated/prisma/client.js';
import type { ApiResponse } from '../../types/apiResponse.js';

export interface RegisterInput {
  email: string;
  fullName: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterOutput {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatar: string | null;
  status: AccountStatus;
}

export type RegisterResponse = ApiResponse<RegisterOutput>;

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  accessToken: string;
  expiresIn: number;
  user: RegisterOutput;
}

export interface UserSessionResult {
  refreshToken: string;
  data: LoginOutput;
}

export interface UserPrincipal {
  userId: bigint;
  sessionId: bigint;
  profile: RegisterOutput;
}

export type LoginResponse = ApiResponse<LoginOutput>;
export type LogoutResponse = ApiResponse<null>;
export type MeResponse = ApiResponse<RegisterOutput>;
