import type { Express } from 'express';
import { prefixApi, prefixAdmin } from '../../config/system.js';
import { authRoutes } from './auth.routes.js';
import { accountRoutes } from './account.routes.js';

export const adminRoutes = (app: Express): void => {
  app.use(prefixApi + prefixAdmin + '/auth', authRoutes);
  app.use(prefixApi + prefixAdmin + '/me', accountRoutes);
};
