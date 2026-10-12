import { Router } from 'express';
import * as healthController from '../../controllers/shared/health.controller.js';

const healthRouter = Router();
healthRouter.get('/health', healthController.health);

export default healthRouter;
