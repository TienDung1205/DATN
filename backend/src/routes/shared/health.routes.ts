import { Router } from 'express';
import * as healthController from '../../controllers/shared/health.controller.js';

const router: Router = Router();
router.get('/health', healthController.health);
router.get('/ready', healthController.ready);

export const healthRoutes: Router = router;
