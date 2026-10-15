import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import type { AppConfig } from './config/env.js';
import { createLogger } from './config/logger.js';
import { URL_PARAMETER_LIMIT } from './constants/http.js';
import { createCors } from './middlewares/shared/origin.middleware.js';
import { notFoundHandler, errorHandler } from './middlewares/shared/errorHandler.middleware.js';
import { requestLogger } from './middlewares/shared/requestLogger.middleware.js';
import { initializeRateLimits } from './middlewares/shared/rateLimit.middleware.js';
import { healthRoutes } from './routes/shared/health.routes.js';

type DatabaseHealthCheck = () => Promise<void>;
type RegisterRoutes = (app: Express) => void;

export const createApp = (config: AppConfig, logger: Logger = createLogger(config), checkDatabase?: DatabaseHealthCheck, registerRoutes?: RegisterRoutes): Express => {
  const app: Express = express();
  app.locals.appConfig = config;
  app.locals.checkDatabase = checkDatabase;

  // Log request, headers và CORS.
  app.disable('x-powered-by');
  app.use(requestLogger(logger));
  app.use(helmet());
  app.use(createCors(config));

  // Đọc JSON.
  app.use(express.json({ limit: config.BODY_LIMIT_BYTES }));

  // Đọc dữ liệu form.
  app.use(express.urlencoded({
    extended: false,
    limit: config.BODY_LIMIT_BYTES,
    parameterLimit: URL_PARAMETER_LIMIT,
  }));

  // Health và kiểm tra kết nối database.
  app.use(healthRoutes);

  // Đăng ký routes sau khi service đã được khởi tạo.
  if (registerRoutes) {
    registerRoutes(app);
  }
  initializeRateLimits(app);

  // Xử lý route không tồn tại và lỗi sau cùng.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
