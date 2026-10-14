import type { Application, RequestHandler } from 'express';
import { AppError } from '../errors/appError.js';

export function getAppValue<T>(app: Application, key: string): T {
  const value = app.locals[key] as T | undefined;

  if (value === undefined || value === null) {
    throw new AppError(503, 'Dịch vụ chưa sẵn sàng.');
  }

  return value;
}

export function perAppMiddleware(createMiddleware: (app: Application) => RequestHandler) {
  const handlers = new WeakMap<Application, RequestHandler>();

  function initialize(app: Application) {
    let handler = handlers.get(app);

    if (!handler) {
      handler = createMiddleware(app);
      handlers.set(app, handler);
    }

    return handler;
  }

  const middleware: RequestHandler = (req, res, next) => {
    const handler = initialize(req.app);
    return handler(req, res, next);
  };

  return Object.assign(middleware, { initialize });
}
