import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HTTP_STATUS } from '../../constants/http.js';
import { AppError } from '../../errors/appError.js';
import type { ApiResponse } from '../../types/apiResponse.js';

function getRequestBodyError(error: unknown): AppError | undefined {
  if (typeof error !== 'object' || error === null || !('type' in error)) {
    return;
  }

  switch (error.type) {
    case 'entity.parse.failed':
      return new AppError(HTTP_STATUS.BAD_REQUEST, 'Nội dung JSON không hợp lệ.');
    case 'entity.too.large':
    case 'parameters.too.many':
      return new AppError(HTTP_STATUS.PAYLOAD_TOO_LARGE, 'Dữ liệu gửi lên quá lớn.');
    case 'encoding.unsupported':
    case 'charset.unsupported':
      return new AppError(HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE, 'Định dạng dữ liệu không được hỗ trợ.');
    case 'request.aborted':
    case 'request.size.invalid':
      return new AppError(HTTP_STATUS.BAD_REQUEST, 'Yêu cầu chưa đầy đủ hoặc không hợp lệ.');
  }
}

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  const error = new AppError(HTTP_STATUS.NOT_FOUND, 'Không tìm thấy tài nguyên.');

  next(error);
};

export const errorHandler: ErrorRequestHandler<Record<string, string>, ApiResponse> = (error: unknown, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  let knownError: AppError | undefined;

  if (error instanceof AppError) {
    knownError = error;
  } else {
    knownError = getRequestBodyError(error);
  }

  if (knownError && knownError.statusCode >= 400 && knownError.statusCode < 500) {
    const response: ApiResponse = {
      success: false,
      message: knownError.message,
    };

    if (knownError.details) {
      response.errors = knownError.details;
    }

    res.status(knownError.statusCode).json(response);
    return;
  }

  req.log?.error({ event: 'unhandled_request_error', requestId: req.id }, 'Request failed');

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Đã xảy ra lỗi hệ thống.',
  });
};
