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
