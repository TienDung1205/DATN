import type { Logger } from 'pino';
import * as appModule from '../app.js';
import type { AppConfig } from './env.js';
import type { createDatabase } from './database.js';
import * as auth from './authServices.js';
import { clientRoutesApiVer1 } from '../routes/client/index.routes.js';

export function createApplication(config: AppConfig, logger: Logger, database: ReturnType<typeof createDatabase>) {
  const authServices = auth.createAuthServices(database.client);
  const app = appModule.createApp(config, logger, database.check, (app) => {
    Object.assign(app.locals, authServices);
    clientRoutesApiVer1(app);
  });
  return { app };
}
