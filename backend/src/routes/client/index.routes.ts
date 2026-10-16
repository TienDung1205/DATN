import type { Express } from 'express';
import { prefixApi } from '../../config/system.js';
import { authRoutes } from './auth.routes.js';

export const clientRoutes = (app: Express): void => {
  app.use(prefixApi + '/auth', authRoutes);
};
