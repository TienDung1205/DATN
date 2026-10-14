import { Router } from 'express';
import * as authController from '../../controllers/client/auth.controller.js';
import { authenticateUser } from '../../middlewares/client/auth.middleware.js';
import { requireFrontendOrigin } from '../../middlewares/shared/authOrigin.middleware.js';
import { noStore } from '../../middlewares/shared/cache.middleware.js';
import { userLoginLimit, userRefreshLimit } from '../../middlewares/shared/rateLimit.middleware.js';
import { validateBody } from '../../middlewares/shared/validateBody.middleware.js';
import { loginSchema, registerSchema } from '../../validators/client/auth.validator.js';

const router: Router = Router();

router.use(noStore);

router.post('/register', requireFrontendOrigin, userLoginLimit, validateBody(registerSchema), authController.register);
router.post('/login', requireFrontendOrigin, userLoginLimit, validateBody(loginSchema), authController.login);

router.post('/refresh', requireFrontendOrigin, userRefreshLimit, authController.refresh);
router.post('/logout', requireFrontendOrigin, userRefreshLimit, authController.logout);

router.get('/me', authenticateUser, authController.me);

export const authRoutes: Router = router;
