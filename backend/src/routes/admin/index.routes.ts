import type { Express } from 'express';
import { prefixApi, prefixAdmin } from '../../config/system.js';
import { authRoutes } from './auth.routes.js';

export const adminRoutesApiVer1 = (app: Express): void => {
  app.use(prefixApi + prefixAdmin + '/auth', authRoutes);
};
