import type { Express } from 'express';
import { prefixApi } from '../../config/system.js';
import { authRoutes } from './auth.routes.js';
import { accountRoutes } from './account.routes.js';

export const clientRoutes = (app: Express): void => {
  app.use(prefixApi + '/auth', authRoutes);
  app.use(prefixApi + '/users/me', accountRoutes);
};
