import type { Express } from 'express';
import * as systemConfig from '../../config/system.js';
import clientAuthRouter from './auth.routes.js';

const clientRoutesApiVer1 = (app: Express): void => {
  app.use(systemConfig.prefixApi + '/auth', clientAuthRouter);
};

export default clientRoutesApiVer1;
