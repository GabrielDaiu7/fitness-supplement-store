"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountOrdersController = accountOrdersController;
exports.accountOrderDetailsController = accountOrderDetailsController;
exports.accountReorderController = accountReorderController;
exports.accountAddressesController = accountAddressesController;
exports.accountCreateAddressController = accountCreateAddressController;
exports.accountPaymentMethodsController = accountPaymentMethodsController;
exports.accountCreatePaymentMethodController = accountCreatePaymentMethodController;
exports.accountCreateSupportTicketController = accountCreateSupportTicketController;
exports.accountSupportTicketsController = accountSupportTicketsController;
exports.accountWishlistController = accountWishlistController;
exports.accountAddWishlistController = accountAddWishlistController;
exports.accountRemoveWishlistController = accountRemoveWishlistController;
exports.adminProductsController = adminProductsController;
exports.adminCreateProductController = adminCreateProductController;
exports.adminOverviewController = adminOverviewController;
exports.adminFunnelController = adminFunnelController;
exports.adminOrdersController = adminOrdersController;
exports.adminUpdateOrderStatusController = adminUpdateOrderStatusController;
exports.adminUsersController = adminUsersController;
exports.adminCouponsController = adminCouponsController;
exports.adminCreateCouponController = adminCreateCouponController;
exports.adminUpdateCouponController = adminUpdateCouponController;
exports.adminUpdateProductController = adminUpdateProductController;
const admin_service_1 = require("../services/admin.service");
async function accountOrdersController(req, res) {
    try {
        const orders = await (0, admin_service_1.getAccountOrders)(req.user?.id);
        res.json({ ok: true, orders });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to load orders' });
    }
}
async function accountOrderDetailsController(req, res) {
    try {
        if (!req.user?.id)
            return res.status(401).json({ ok: false, message: 'Unauthorized' });
        const order = await (0, admin_service_1.getAccountOrderDetails)(req.user.id, String(req.params.orderCode ?? ''));
        if (!order)
            return res.status(404).json({ ok: false, message: 'Order not found' });
        res.json({ ok: true, order });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to load order details' });
    }
}
async function accountReorderController(req, res) {
    try {
        if (!req.user?.id)
            return res.status(401).json({ ok: false, message: 'Unauthorized' });
        const items = await (0, admin_service_1.reorderFromPreviousOrder)(req.user.id, String(req.params.orderCode ?? ''));
        if (!items)
            return res.status(404).json({ ok: false, message: 'Order not found' });
        res.json({ ok: true, items });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to reorder' });
    }
}
async function accountAddressesController(req, res) {
    try {
        if (!req.user?.id)
            return res.status(401).json({ ok: false, message: 'Unauthorized' });
        const addresses = await (0, admin_service_1.getAccountAddresses)(req.user.id);
        res.json({ ok: true, addresses });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to load addresses' });
    }
}
async function accountCreateAddressController(req, res) {
    try {
        if (!req.user?.id)
            return res.status(401).json({ ok: false, message: 'Unauthorized' });
        const address = await (0, admin_service_1.addAccountAddress)(req.user.id, {
            fullName: String(req.body?.fullName ?? '').trim(),
            email: String(req.body?.email ?? '').trim(),
            address: String(req.body?.address ?? '').trim(),
            city: String(req.body?.city ?? '').trim(),
            zip: String(req.body?.zip ?? '').trim(),
            isDefault: Boolean(req.body?.isDefault ?? false),
        });
        res.status(201).json({ ok: true, address });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to save address' });
    }
}
async function accountPaymentMethodsController(req, res) {
    try {
        if (!req.user?.id)
            return res.status(401).json({ ok: false, message: 'Unauthorized' });
        const paymentMethods = await (0, admin_service_1.getPaymentMethods)(req.user.id);
        res.json({ ok: true, paymentMethods });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to load payment methods' });
    }
}
async function accountCreatePaymentMethodController(req, res) {
    try {
        if (!req.user?.id)
            return res.status(401).json({ ok: false, message: 'Unauthorized' });
        const paymentMethod = await (0, admin_service_1.addPaymentMethod)(req.user.id, {
            cardBrand: String(req.body?.cardBrand ?? '').trim(),
            cardNumber: String(req.body?.cardNumber ?? '').trim(),
            expMonth: Number(req.body?.expMonth ?? 0),
            expYear: Number(req.body?.expYear ?? 0),
            isDefault: Boolean(req.body?.isDefault ?? false),
        });
        res.status(201).json({ ok: true, paymentMethod });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to save payment method' });
    }
}
async function accountCreateSupportTicketController(req, res) {
    try {
        if (!req.user?.id)
            return res.status(401).json({ ok: false, message: 'Unauthorized' });
        const ticket = await (0, admin_service_1.createSupportTicket)(req.user.id, {
            orderCode: typeof req.body?.orderCode === 'string' ? req.body.orderCode.trim() : undefined,
            issueType: String(req.body?.issueType ?? 'general').trim(),
            message: String(req.body?.message ?? '').trim(),
            returnRequested: Boolean(req.body?.returnRequested ?? false),
        });
        res.status(201).json({ ok: true, ticket });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to create support ticket' });
    }
}
async function accountSupportTicketsController(req, res) {
    try {
        if (!req.user?.id)
            return res.status(401).json({ ok: false, message: 'Unauthorized' });
        const tickets = await (0, admin_service_1.getSupportTickets)(req.user.id);
        res.json({ ok: true, tickets });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to load support tickets' });
    }
}
async function accountWishlistController(req, res) {
    try {
        if (!req.user?.id)
            return res.status(401).json({ ok: false, message: 'Unauthorized' });
        const products = await (0, admin_service_1.getWishlistProducts)(req.user.id);
        res.json({ ok: true, products });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to load wishlist' });
    }
}
async function accountAddWishlistController(req, res) {
    try {
        if (!req.user?.id)
            return res.status(401).json({ ok: false, message: 'Unauthorized' });
        const products = await (0, admin_service_1.addWishlistProduct)(req.user.id, Number(req.params.productId));
        res.status(201).json({ ok: true, products });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to save wishlist item' });
    }
}
async function accountRemoveWishlistController(req, res) {
    try {
        if (!req.user?.id)
            return res.status(401).json({ ok: false, message: 'Unauthorized' });
        const products = await (0, admin_service_1.removeWishlistProduct)(req.user.id, Number(req.params.productId));
        res.json({ ok: true, products });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to remove wishlist item' });
    }
}
async function adminProductsController(_req, res) {
    const products = await (0, admin_service_1.getAdminProducts)();
    res.json({ ok: true, products });
}
async function adminCreateProductController(req, res) {
    try {
        const name = String(req.body?.name ?? '').trim();
        const category = String(req.body?.category ?? '').trim();
        const brand = String(req.body?.brand ?? '').trim();
        const flavor = String(req.body?.flavor ?? '').trim();
        const servings = Number(req.body?.servings ?? 0);
        const description = String(req.body?.description ?? '').trim();
        const image = String(req.body?.image ?? '').trim();
        const imagesRaw = Array.isArray(req.body?.images) ? req.body.images : [];
        const images = imagesRaw.filter((value) => typeof value === 'string' && value.trim().length > 0);
        const price = Number(req.body?.price);
        const stockQuantity = Number(req.body?.stockQuantity ?? 25);
        const lowStockThreshold = Number(req.body?.lowStockThreshold ?? 5);
        if (!name || !category || !Number.isFinite(price) || !Number.isFinite(stockQuantity) || !Number.isFinite(lowStockThreshold)) {
            res.status(400).json({ ok: false, message: 'Invalid product payload' });
            return;
        }
        const product = await (0, admin_service_1.createAdminProduct)({
            name,
            brand,
            category,
            flavor,
            servings: Number.isFinite(servings) ? servings : 0,
            price,
            description,
            image,
            images,
            inStock: stockQuantity > 0 && Boolean(req.body?.inStock ?? true),
            stockQuantity,
            lowStockThreshold,
            featured: Boolean(req.body?.featured ?? false),
            supplementFacts: typeof req.body?.supplementFacts === 'object' && req.body?.supplementFacts ? req.body.supplementFacts : {},
        });
        res.status(201).json({ ok: true, product });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to create product' });
    }
}
async function adminOverviewController(_req, res) {
    try {
        const metrics = await (0, admin_service_1.getAdminOverview)();
        res.json({ ok: true, metrics });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to load admin overview' });
    }
}
async function adminFunnelController(_req, res) {
    try {
        const metrics = await (0, admin_service_1.getAdminFunnelMetrics)();
        res.json({ ok: true, metrics });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to load funnel metrics' });
    }
}
async function adminOrdersController(_req, res) {
    try {
        const orders = await (0, admin_service_1.getAdminOrders)();
        res.json({ ok: true, orders });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to load admin orders' });
    }
}
async function adminUpdateOrderStatusController(req, res) {
    try {
        const id = Number(req.params.id);
        const status = String(req.body?.status ?? '').trim().toLowerCase();
        if (!['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
            res.status(400).json({ ok: false, message: 'Invalid order status' });
            return;
        }
        const order = await (0, admin_service_1.updateOrderStatus)(id, status);
        res.json({ ok: true, order });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to update order status' });
    }
}
async function adminUsersController(_req, res) {
    try {
        const users = await (0, admin_service_1.getAdminUsers)();
        res.json({ ok: true, users });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to load admin users' });
    }
}
async function adminCouponsController(_req, res) {
    try {
        const coupons = await (0, admin_service_1.getAdminCoupons)();
        res.json({ ok: true, coupons });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to load coupons' });
    }
}
async function adminCreateCouponController(req, res) {
    try {
        const code = String(req.body?.code ?? '').trim().toUpperCase();
        const description = String(req.body?.description ?? '').trim();
        const discountPercent = Number(req.body?.discountPercent);
        const minSubtotal = Number(req.body?.minSubtotal ?? 0);
        const expiresAt = String(req.body?.expiresAt ?? '').trim();
        if (!code || !Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100 || !Number.isFinite(minSubtotal)) {
            res.status(400).json({ ok: false, message: 'Invalid coupon payload' });
            return;
        }
        const coupon = await (0, admin_service_1.createAdminCoupon)({
            code,
            description,
            discountPercent,
            minSubtotal,
            active: Boolean(req.body?.active ?? true),
            expiresAt: expiresAt || null,
        });
        res.status(201).json({ ok: true, coupon });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to create coupon' });
    }
}
async function adminUpdateCouponController(req, res) {
    try {
        const id = Number(req.params.id);
        const discountPercent = Number(req.body?.discountPercent);
        const minSubtotal = Number(req.body?.minSubtotal);
        const expiresAt = String(req.body?.expiresAt ?? '').trim();
        const coupon = await (0, admin_service_1.updateAdminCoupon)(id, {
            description: typeof req.body?.description === 'string' ? req.body.description.trim() : null,
            discountPercent: Number.isFinite(discountPercent) ? discountPercent : null,
            minSubtotal: Number.isFinite(minSubtotal) ? minSubtotal : null,
            active: typeof req.body?.active === 'boolean' ? req.body.active : null,
            expiresAt: expiresAt || null,
        });
        if (!coupon) {
            res.status(404).json({ ok: false, message: 'Coupon not found' });
            return;
        }
        res.json({ ok: true, coupon });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to update coupon' });
    }
}
async function adminUpdateProductController(req, res) {
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
        const stockQuantityRaw = Number(req.body?.stockQuantity);
        const lowStockThresholdRaw = Number(req.body?.lowStockThreshold);
        const imagesRaw = req.body?.images;
        const product = await (0, admin_service_1.updateAdminProduct)(id, {
            name: typeof nameRaw === 'string' ? nameRaw.trim() : null,
            category: typeof categoryRaw === 'string' ? categoryRaw.trim() : null,
            description: typeof descriptionRaw === 'string' ? descriptionRaw.trim() : null,
            image: typeof imageRaw === 'string' ? imageRaw.trim() : null,
            brand: typeof brandRaw === 'string' ? brandRaw.trim() : null,
            flavor: typeof flavorRaw === 'string' ? flavorRaw.trim() : null,
            servings: Number.isFinite(servingsRaw) ? servingsRaw : null,
            images: Array.isArray(imagesRaw)
                ? imagesRaw.filter((value) => typeof value === 'string' && value.trim().length > 0)
                : null,
            price: Number.isFinite(price) ? price : null,
            inStock: typeof req.body?.inStock === 'boolean' ? req.body.inStock : null,
            stockQuantity: Number.isFinite(stockQuantityRaw) ? stockQuantityRaw : null,
            lowStockThreshold: Number.isFinite(lowStockThresholdRaw) ? lowStockThresholdRaw : null,
            featured: typeof req.body?.featured === 'boolean' ? req.body.featured : null,
            supplementFacts: typeof req.body?.supplementFacts === 'object' && req.body?.supplementFacts ? req.body.supplementFacts : null,
        });
        res.json({ ok: true, product });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to update product' });
    }
}
