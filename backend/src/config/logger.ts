import * as pino from 'pino';
import type { DestinationStream, Logger, LoggerOptions } from 'pino';
import type { AppConfig } from './env.js';

const SENSITIVE_LOG_FIELDS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'token_hash',
  'tokenHash',
  'authorization',
  'cookie',
  'req.headers',
  'req.body',
  'res.headers',
];

function serializeErrorForLog() {
  return { type: 'InternalError' };
}

export function createLogger(config: AppConfig, destination?: DestinationStream): Logger {
  const options: LoggerOptions = {
    level: config.LOG_LEVEL,
    base: {
      service: 'bookstore-api',
      environment: config.NODE_ENV,
    },
    redact: {
      paths: SENSITIVE_LOG_FIELDS,
      censor: '[REDACTED]',
    },
    serializers: {
      err: serializeErrorForLog,
    },
  };

  if (destination) {
    return pino.pino(options, destination);
  }

  return pino.pino(options);
}
