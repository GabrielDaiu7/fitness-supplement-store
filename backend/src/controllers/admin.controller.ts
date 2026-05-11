import express from 'express';
import {
  createAdminProduct,
  createSupportTicket,
  getAccountAddresses,
  getAccountOrderDetails,
  getAccountOrders,
  getAdminFunnelMetrics,
  getAdminOrders,
  getAdminOverview,
  getAdminProducts,
  getAdminUsers,
  getPaymentMethods,
  getSupportTickets,
  reorderFromPreviousOrder,
  addAccountAddress,
  addPaymentMethod,
  updateAdminProduct,
  updateOrderStatus,
} from '../services/admin.service';
import { AuthedRequest } from '../types/auth';

export async function accountOrdersController(req: AuthedRequest, res: express.Response) {
  try {
    const orders = await getAccountOrders(req.user?.id);
    res.json({ ok: true, orders });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load orders' });
  }
}

export async function accountOrderDetailsController(req: AuthedRequest, res: express.Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    const order = await getAccountOrderDetails(req.user.id, String(req.params.orderCode ?? ''));
    if (!order) return res.status(404).json({ ok: false, message: 'Order not found' });
    res.json({ ok: true, order });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load order details' });
  }
}

export async function accountReorderController(req: AuthedRequest, res: express.Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    const items = await reorderFromPreviousOrder(req.user.id, String(req.params.orderCode ?? ''));
    if (!items) return res.status(404).json({ ok: false, message: 'Order not found' });
    res.json({ ok: true, items });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to reorder' });
  }
}

export async function accountAddressesController(req: AuthedRequest, res: express.Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    const addresses = await getAccountAddresses(req.user.id);
    res.json({ ok: true, addresses });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load addresses' });
  }
}

export async function accountCreateAddressController(req: AuthedRequest, res: express.Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    const address = await addAccountAddress(req.user.id, {
      fullName: String(req.body?.fullName ?? '').trim(),
      email: String(req.body?.email ?? '').trim(),
      address: String(req.body?.address ?? '').trim(),
      city: String(req.body?.city ?? '').trim(),
      zip: String(req.body?.zip ?? '').trim(),
      isDefault: Boolean(req.body?.isDefault ?? false),
    });
    res.status(201).json({ ok: true, address });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to save address' });
  }
}

export async function accountPaymentMethodsController(req: AuthedRequest, res: express.Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    const paymentMethods = await getPaymentMethods(req.user.id);
    res.json({ ok: true, paymentMethods });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load payment methods' });
  }
}

export async function accountCreatePaymentMethodController(req: AuthedRequest, res: express.Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    const paymentMethod = await addPaymentMethod(req.user.id, {
      cardBrand: String(req.body?.cardBrand ?? '').trim(),
      cardNumber: String(req.body?.cardNumber ?? '').trim(),
      expMonth: Number(req.body?.expMonth ?? 0),
      expYear: Number(req.body?.expYear ?? 0),
      isDefault: Boolean(req.body?.isDefault ?? false),
    });
    res.status(201).json({ ok: true, paymentMethod });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to save payment method' });
  }
}

export async function accountCreateSupportTicketController(req: AuthedRequest, res: express.Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    const ticket = await createSupportTicket(req.user.id, {
      orderCode: typeof req.body?.orderCode === 'string' ? req.body.orderCode.trim() : undefined,
      issueType: String(req.body?.issueType ?? 'general').trim(),
      message: String(req.body?.message ?? '').trim(),
      returnRequested: Boolean(req.body?.returnRequested ?? false),
    });
    res.status(201).json({ ok: true, ticket });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to create support ticket' });
  }
}

export async function accountSupportTicketsController(req: AuthedRequest, res: express.Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    const tickets = await getSupportTickets(req.user.id);
    res.json({ ok: true, tickets });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load support tickets' });
  }
}

export async function adminProductsController(_req: express.Request, res: express.Response) {
  const products = await getAdminProducts();
  res.json({ ok: true, products });
}

export async function adminCreateProductController(req: express.Request, res: express.Response) {
  try {
    const name = String(req.body?.name ?? '').trim();
    const category = String(req.body?.category ?? '').trim();
    const brand = String(req.body?.brand ?? '').trim();
    const flavor = String(req.body?.flavor ?? '').trim();
    const servings = Number(req.body?.servings ?? 0);
    const description = String(req.body?.description ?? '').trim();
    const image = String(req.body?.image ?? '').trim();
    const imagesRaw = Array.isArray(req.body?.images) ? req.body.images : [];
    const images = imagesRaw.filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0);
    const price = Number(req.body?.price);

    if (!name || !category || !Number.isFinite(price)) {
      res.status(400).json({ ok: false, message: 'Invalid product payload' });
      return;
    }

    const product = await createAdminProduct({
      name,
      brand,
      category,
      flavor,
      servings: Number.isFinite(servings) ? servings : 0,
      price,
      description,
      image,
      images,
      inStock: Boolean(req.body?.inStock ?? true),
      featured: Boolean(req.body?.featured ?? false),
    });

    res.status(201).json({ ok: true, product });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to create product' });
  }
}

export async function adminOverviewController(_req: express.Request, res: express.Response) {
  try {
    const metrics = await getAdminOverview();
    res.json({ ok: true, metrics });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load admin overview' });
  }
}

export async function adminFunnelController(_req: express.Request, res: express.Response) {
  try {
    const metrics = await getAdminFunnelMetrics();
    res.json({ ok: true, metrics });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load funnel metrics' });
  }
}

export async function adminOrdersController(_req: express.Request, res: express.Response) {
  try {
    const orders = await getAdminOrders();
    res.json({ ok: true, orders });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load admin orders' });
  }
}

export async function adminUpdateOrderStatusController(req: express.Request, res: express.Response) {
  try {
    const id = Number(req.params.id);
    const status = String(req.body?.status ?? '').trim().toLowerCase();
    if (!['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      res.status(400).json({ ok: false, message: 'Invalid order status' });
      return;
    }

    const order = await updateOrderStatus(id, status);
    res.json({ ok: true, order });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to update order status' });
  }
}

export async function adminUsersController(_req: express.Request, res: express.Response) {
  try {
    const users = await getAdminUsers();
    res.json({ ok: true, users });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load admin users' });
  }
}

export async function adminUpdateProductController(req: express.Request, res: express.Response) {
  try {
    const id = Number(req.params.id);
    const price = Number(req.body?.price);
    const nameRaw = req.body?.name;
    const categoryRaw = req.body?.category;
    const descriptionRaw = req.body?.description;
    const imageRaw = req.body?.image;
    const brandRaw = req.body?.brand;
    const flavorRaw = req.body?.flavor;
    const servingsRaw = Number(req.body?.servings);
    const imagesRaw = req.body?.images;

    const product = await updateAdminProduct(id, {
      name: typeof nameRaw === 'string' ? nameRaw.trim() : null,
      category: typeof categoryRaw === 'string' ? categoryRaw.trim() : null,
      description: typeof descriptionRaw === 'string' ? descriptionRaw.trim() : null,
      image: typeof imageRaw === 'string' ? imageRaw.trim() : null,
      brand: typeof brandRaw === 'string' ? brandRaw.trim() : null,
      flavor: typeof flavorRaw === 'string' ? flavorRaw.trim() : null,
      servings: Number.isFinite(servingsRaw) ? servingsRaw : null,
      images:
        Array.isArray(imagesRaw)
          ? imagesRaw.filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
          : null,
      price: Number.isFinite(price) ? price : null,
      inStock: typeof req.body?.inStock === 'boolean' ? req.body.inStock : null,
      featured: typeof req.body?.featured === 'boolean' ? req.body.featured : null,
    });

    res.json({ ok: true, product });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to update product' });
  }
}
