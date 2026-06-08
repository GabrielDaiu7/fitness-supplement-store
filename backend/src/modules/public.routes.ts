import { Router } from 'express';
import {
  getProductController,
  healthController,
  listCategoriesController,
  listProductsController,
  newsletterSubscribeController,
  productReviewController,
} from '../controllers/catalog.controller';
import { checkoutController } from '../controllers/checkout.controller';
import { authGuard } from '../middleware/auth';

const publicRouter = Router();

publicRouter.get('/health', healthController);
publicRouter.get('/products', listProductsController);
publicRouter.get('/products/:id', getProductController);
publicRouter.post('/products/:id/reviews', authGuard, productReviewController);
publicRouter.get('/categories', listCategoriesController);
publicRouter.post('/newsletter', newsletterSubscribeController);
publicRouter.post('/checkout', checkoutController);

export default publicRouter;
