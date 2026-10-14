import type { Logger } from 'pino';
import { createApp } from '../app.js';
import type { AppConfig } from './env.js';
import type { createDatabase } from './database.js';
import { createAuthServices } from './authServices.js';
import { clientRoutesApiVer1 } from '../routes/client/index.routes.js';

export async function createApplication(config: AppConfig, logger: Logger, database: ReturnType<typeof createDatabase>) {
  const authServices = await createAuthServices(database.client);

  const app = createApp(config, logger, database.check, (app) => {
    Object.assign(app.locals, authServices);
    clientRoutesApiVer1(app);
  });

  return { app };
}
