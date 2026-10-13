import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import type { Logger } from 'pino';
import { REQUEST_ID_HEADER } from '../../constants/http.js';

export function requestLogger(logger: Logger) {
  return pinoHttp({
    logger,
    genReqId: (_req, res) => {
      const requestId = randomUUID();

      res.setHeader(REQUEST_ID_HEADER, requestId);
      return requestId;
    },
    customLogLevel(_req, res, error) {
      if (error || res.statusCode >= 500) {
        return 'error';
      }

      if (res.statusCode >= 400) {
        return 'warn';
      }

      return 'info';
    },
    serializers: {
      req(request) {
        const path = request.url?.split('?')[0];

        return {
          id: request.id,
          method: request.method,
          path,
        };
      },
      res(response) {
        return { statusCode: response.statusCode };
      },
      err() {
        return { type: 'RequestError' };
      },
    },
  });
}
