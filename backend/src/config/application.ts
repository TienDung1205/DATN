import type { Logger } from 'pino';
import { createApp } from '../app.js';
import type { AppConfig } from './env.js';
import type { createDatabase } from './database.js';
import { readUserAuthConfig, readAdminAuthConfig } from './auth.js';
import { createUserAuthRepository } from '../repositories/client/auth.repository.js';
import { createAdminAuthRepository } from '../repositories/admin/auth.repository.js';
import { createUserAuthService } from '../services/client/auth/auth.service.js';
import { createUserAccountService } from '../services/client/account.service.js';
import { createAdminAuthService } from '../services/admin/auth/auth.service.js';
import { clientRoutes } from '../routes/client/index.routes.js';
import { adminRoutes } from '../routes/admin/index.routes.js';
import { readMediaConfig } from './media.js';
import { createMediaService } from '../services/shared/media.service.js';

export async function createApplication(config: AppConfig, logger: Logger, database: ReturnType<typeof createDatabase>) {
  const userAuthConfig = readUserAuthConfig(process.env);
  const adminAuthConfig = readAdminAuthConfig(process.env);
  const mediaConfig = readMediaConfig(process.env);
  const mediaService = createMediaService(mediaConfig, logger);

  const userRepository = createUserAuthRepository(database.client);
  const adminRepository = createAdminAuthRepository(database.client);
  const userAuthService = await createUserAuthService(userRepository, userAuthConfig);
  const userAccountService = createUserAccountService(userRepository, mediaService);
  const adminAuthService = await createAdminAuthService(adminRepository, adminAuthConfig);

  const app = createApp(config, logger, database.check, (app) => {
    Object.assign(app.locals, {
      userAuthConfig,
      adminAuthConfig,
      mediaConfig,
      userAuthService,
      userAccountService,
      adminAuthService,
    });
    clientRoutes(app);
    adminRoutes(app);
  });

  return { app };
}
