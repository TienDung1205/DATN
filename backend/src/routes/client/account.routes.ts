import { Router } from 'express';
import * as accountController from '../../controllers/client/account.controller.js';
import { authenticateUser } from '../../middlewares/client/auth.middleware.js';
import { requireFrontendOrigin } from '../../middlewares/shared/origin.middleware.js';
import { noStore } from '../../middlewares/shared/cache.middleware.js';
import { userPasswordLimit } from '../../middlewares/shared/rateLimit.middleware.js';
import { validateBody } from '../../middlewares/shared/validateBody.middleware.js';
import { changePasswordSchema } from '../../validators/client/auth.validator.js';
import { updateProfileSchema } from '../../validators/client/account.validator.js';

const router: Router = Router();

router.use(noStore);
router.patch('/', requireFrontendOrigin, authenticateUser, validateBody(updateProfileSchema), accountController.updateProfile);
router.post('/change-password', requireFrontendOrigin, userPasswordLimit, authenticateUser, validateBody(changePasswordSchema), accountController.changePassword);

export const accountRoutes: Router = router;
