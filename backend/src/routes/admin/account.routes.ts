import { Router } from 'express';
import * as accountController from '../../controllers/admin/account.controller.js';
import { authenticateAdmin } from '../../middlewares/admin/auth.middleware.js';
import { requireFrontendOrigin } from '../../middlewares/shared/origin.middleware.js';
import { noStore } from '../../middlewares/shared/cache.middleware.js';
import { adminPasswordLimit } from '../../middlewares/shared/rateLimit.middleware.js';
import { validateBody } from '../../middlewares/shared/validateBody.middleware.js';
import { changePasswordSchema } from '../../validators/admin/auth.validator.js';
import { updateProfileSchema } from '../../validators/admin/account.validator.js';

const router: Router = Router();

router.use(noStore);
router.patch('/', requireFrontendOrigin, authenticateAdmin, validateBody(updateProfileSchema), accountController.updateProfile);
router.post('/change-password', requireFrontendOrigin, adminPasswordLimit, authenticateAdmin, validateBody(changePasswordSchema), accountController.changePassword);

export const accountRoutes: Router = router;
