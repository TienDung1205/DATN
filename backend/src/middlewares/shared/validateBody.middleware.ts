import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { HTTP_STATUS } from '../../constants/http.js';
import { AppError } from '../../errors/appError.js';
import type { ErrorDetail } from '../../types/apiResponse.js';

export function validateBody(schema: ZodType): RequestHandler {
  return async (req, _res, next) => {
    const validation = await schema.safeParseAsync(req.body);

    if (validation.success) {
      req.body = validation.data;
      next();
      return;
    }

    const errors: ErrorDetail[] = [];

    for (const issue of validation.error.issues) {
      const fieldName = issue.path.map(String).join('.');

      errors.push({
        field: fieldName,
        message: issue.message,
      });
    }

    const error = new AppError(
      HTTP_STATUS.BAD_REQUEST,
      'Dữ liệu không hợp lệ.',
      errors,
    );

    next(error);
  };
}
