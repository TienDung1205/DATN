import * as express from 'express';
import * as authController from '../../controllers/client/auth.controller.js';
import * as authOriginMiddleware from '../../middlewares/shared/authOrigin.middleware.js';
import * as validateBodyMiddleware from '../../middlewares/shared/validateBody.middleware.js';
import * as authValidator from '../../validators/client/auth.validator.js';
import * as rateLimitMiddleware from '../../middlewares/shared/rateLimit.middleware.js';
import * as cacheMiddleware from '../../middlewares/shared/cache.middleware.js';

const clientAuthRouter = express.Router();

clientAuthRouter.use(cacheMiddleware.noStore);
clientAuthRouter.post(
  '/register',
  authOriginMiddleware.requireFrontendOrigin,
  rateLimitMiddleware.userLoginLimit,
  validateBodyMiddleware.validateBody(authValidator.registerSchema),
  authController.register,
);

export default clientAuthRouter;
