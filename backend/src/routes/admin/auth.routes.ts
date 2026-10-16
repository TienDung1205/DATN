import { Router } from 'express';
import * as authController from '../../controllers/admin/auth.controller.js';
import { authenticateAdmin } from '../../middlewares/admin/auth.middleware.js';
import { requireFrontendOrigin } from '../../middlewares/shared/origin.middleware.js';
import { noStore } from '../../middlewares/shared/cache.middleware.js';
import { adminLoginLimit, adminRefreshLimit } from '../../middlewares/shared/rateLimit.middleware.js';
import { validateBody } from '../../middlewares/shared/validateBody.middleware.js';
import { loginSchema } from '../../validators/admin/auth.validator.js';

const router: Router = Router();

router.use(noStore);
router.post('/login', requireFrontendOrigin, adminLoginLimit, validateBody(loginSchema), authController.login);
router.post('/refresh', requireFrontendOrigin, adminRefreshLimit, authController.refresh);
router.post('/logout', requireFrontendOrigin, adminRefreshLimit, authController.logout);
router.get('/me', authenticateAdmin, authController.me);

export const authRoutes: Router = router;
