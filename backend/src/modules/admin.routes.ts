import { Router } from 'express';
import {
  accountAddressesController,
  accountCreateAddressController,
  accountCreatePaymentMethodController,
  accountCreateSupportTicketController,
  accountOrderDetailsController,
  accountOrdersController,
  accountPaymentMethodsController,
  accountReorderController,
  accountAddWishlistController,
  accountRemoveWishlistController,
  accountSupportTicketsController,
  accountWishlistController,
  adminFunnelController,
  adminCreateProductController,
  adminCouponsController,
  adminCreateCouponController,
  adminOrdersController,
  adminOverviewController,
  adminProductsController,
  adminUpdateOrderStatusController,
  adminUpdateCouponController,
  adminUpdateProductController,
  adminUsersController,
} from '../controllers/admin.controller';
import { adminGuard, authGuard } from '../middleware/auth';

const accountRouter = Router();
accountRouter.get('/orders', authGuard, accountOrdersController);
accountRouter.get('/orders/:orderCode', authGuard, accountOrderDetailsController);
accountRouter.post('/orders/:orderCode/reorder', authGuard, accountReorderController);
accountRouter.get('/addresses', authGuard, accountAddressesController);
accountRouter.post('/addresses', authGuard, accountCreateAddressController);
accountRouter.get('/payment-methods', authGuard, accountPaymentMethodsController);
accountRouter.post('/payment-methods', authGuard, accountCreatePaymentMethodController);
accountRouter.get('/support/tickets', authGuard, accountSupportTicketsController);
accountRouter.post('/support/tickets', authGuard, accountCreateSupportTicketController);
accountRouter.get('/wishlist', authGuard, accountWishlistController);
accountRouter.post('/wishlist/:productId', authGuard, accountAddWishlistController);
accountRouter.delete('/wishlist/:productId', authGuard, accountRemoveWishlistController);

const adminRouter = Router();
adminRouter.use(authGuard, adminGuard);
adminRouter.get('/products', adminProductsController);
adminRouter.post('/products', adminCreateProductController);
adminRouter.patch('/products/:id', adminUpdateProductController);
adminRouter.get('/overview', adminOverviewController);
adminRouter.get('/funnel', adminFunnelController);
adminRouter.get('/coupons', adminCouponsController);
adminRouter.post('/coupons', adminCreateCouponController);
adminRouter.patch('/coupons/:id', adminUpdateCouponController);
adminRouter.get('/orders', adminOrdersController);
adminRouter.patch('/orders/:id/status', adminUpdateOrderStatusController);
adminRouter.get('/users', adminUsersController);

export { accountRouter, adminRouter };
