export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const REQUEST_ID_HEADER = 'X-Request-Id';
export const URL_PARAMETER_LIMIT = 100;
export const SERVER_TIMEOUTS = {
  request: 30_000,
  headers: 15_000,
  keepAlive: 5_000,
} as const;
