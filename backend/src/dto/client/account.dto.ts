import type { ApiResponse } from '../../types/apiResponse.js';
import type { UserOutput } from './auth.dto.js';

export interface UpdateProfileInput {
  fullName?: string | undefined;
  phone?: string | null | undefined;
  avatar?: string | null | undefined;
}

export type UpdateProfileOutput = UserOutput;
export type UpdateProfileResponse = ApiResponse<UpdateProfileOutput>;

export interface UpdateProfileMultipartInput extends UpdateProfileInput {
  image?: Express.Multer.File | undefined;
}
