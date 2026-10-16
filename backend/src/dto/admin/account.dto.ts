import type { ApiResponse } from '../../types/apiResponse.js';
import type { AdminOutput } from './auth.dto.js';

export interface UpdateProfileInput {
  fullName?: string | undefined;
  phone?: string | null | undefined;
}

export type UpdateProfileOutput = AdminOutput;
export type UpdateProfileResponse = ApiResponse<UpdateProfileOutput>;
