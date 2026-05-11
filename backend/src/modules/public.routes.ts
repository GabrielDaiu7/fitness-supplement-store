import { Router } from 'express';
import {
  getProductController,
  healthController,
  listCategoriesController,
  listProductsController,
} from '../controllers/catalog.controller';
import { checkoutController } from '../controllers/checkout.controller';

const publicRouter = Router();

publicRouter.get('/health', healthController);
publicRouter.get('/products', listProductsController);
publicRouter.get('/products/:id', getProductController);
publicRouter.get('/categories', listCategoriesController);
publicRouter.post('/checkout', checkoutController);

export default publicRouter;
