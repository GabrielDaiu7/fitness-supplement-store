"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccountOrders = getAccountOrders;
exports.getAccountOrderDetails = getAccountOrderDetails;
exports.getAccountAddresses = getAccountAddresses;
exports.addAccountAddress = addAccountAddress;
exports.getPaymentMethods = getPaymentMethods;
exports.addPaymentMethod = addPaymentMethod;
exports.reorderFromPreviousOrder = reorderFromPreviousOrder;
exports.createSupportTicket = createSupportTicket;
exports.getSupportTickets = getSupportTickets;
exports.getAdminProducts = getAdminProducts;
exports.createAdminProduct = createAdminProduct;
exports.getAdminOverview = getAdminOverview;
exports.getAdminFunnelMetrics = getAdminFunnelMetrics;
exports.getAdminOrders = getAdminOrders;
exports.updateOrderStatus = updateOrderStatus;
exports.getAdminUsers = getAdminUsers;
exports.updateAdminProduct = updateAdminProduct;
const pool_1 = require("../db/pool");
async function getAccountOrders(userId) {
    const orders = await pool_1.pool.query(`SELECT id, order_code as "orderCode", subtotal, shipping, tax, discount, total, promo_code as "promoCode",
            subscription_frequency as "subscriptionFrequency", status, created_at as "createdAt"
     FROM orders WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    return orders.rows;
}
async function getAccountOrderDetails(userId, orderCode) {
    const orderResult = await pool_1.pool.query(`SELECT id, order_code as "orderCode", subtotal, shipping, tax, discount, total, promo_code as "promoCode",
            subscription_frequency as "subscriptionFrequency", status, created_at as "createdAt"
     FROM orders WHERE user_id = $1 AND order_code = $2`, [userId, orderCode]);
    const order = orderResult.rows[0];
    if (!order)
        return null;
    const items = await pool_1.pool.query(`SELECT oi.product_id as "productId", p.name, oi.quantity, oi.unit_price as "unitPrice"
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1`, [order.id]);
    return { ...order, items: items.rows };
}
async function getAccountAddresses(userId) {
    const result = await pool_1.pool.query(`SELECT id, full_name as "fullName", email, address, city, zip, is_default as "isDefault"
     FROM addresses
     WHERE user_id = $1
     ORDER BY is_default DESC, id DESC`, [userId]);
    return result.rows;
}
async function addAccountAddress(userId, input) {
    if (input.isDefault) {
        await pool_1.pool.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [userId]);
    }
    const result = await pool_1.pool.query(`INSERT INTO addresses (user_id, full_name, email, address, city, zip, is_default)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, full_name as "fullName", email, address, city, zip, is_default as "isDefault"`, [userId, input.fullName, input.email, input.address, input.city, input.zip, input.isDefault]);
    return result.rows[0];
}
async function getPaymentMethods(userId) {
    const result = await pool_1.pool.query(`SELECT id, card_brand as "cardBrand", last4, exp_month as "expMonth", exp_year as "expYear", is_default as "isDefault"
     FROM payment_methods
     WHERE user_id = $1
     ORDER BY is_default DESC, id DESC`, [userId]);
    return result.rows;
}
async function addPaymentMethod(userId, input) {
    const digitsOnly = input.cardNumber.replace(/\D/g, '');
    const last4 = digitsOnly.slice(-4);
    if (input.isDefault) {
        await pool_1.pool.query('UPDATE payment_methods SET is_default = false WHERE user_id = $1', [userId]);
    }
    const result = await pool_1.pool.query(`INSERT INTO payment_methods (user_id, card_brand, last4, exp_month, exp_year, is_default)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, card_brand as "cardBrand", last4, exp_month as "expMonth", exp_year as "expYear", is_default as "isDefault"`, [userId, input.cardBrand, last4, input.expMonth, input.expYear, input.isDefault]);
    return result.rows[0];
}
async function reorderFromPreviousOrder(userId, orderCode) {
    const order = await pool_1.pool.query('SELECT id FROM orders WHERE user_id = $1 AND order_code = $2', [userId, orderCode]);
    if (!order.rows[0])
        return null;
    const items = await pool_1.pool.query(`SELECT oi.product_id as id, oi.quantity
     FROM order_items oi
     WHERE oi.order_id = $1`, [order.rows[0].id]);
    return items.rows;
}
async function createSupportTicket(userId, input) {
    let orderId = null;
    if (input.orderCode) {
        const order = await pool_1.pool.query('SELECT id FROM orders WHERE user_id = $1 AND order_code = $2', [userId, input.orderCode]);
        orderId = order.rows[0]?.id ?? null;
    }
    const result = await pool_1.pool.query(`INSERT INTO support_tickets (user_id, order_id, issue_type, message, return_status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, issue_type as "issueType", message, status, return_status as "returnStatus", created_at as "createdAt"`, [userId, orderId, input.issueType, input.message, input.returnRequested ? 'requested' : 'not_requested']);
    return result.rows[0];
}
async function getSupportTickets(userId) {
    const result = await pool_1.pool.query(`SELECT st.id, st.issue_type as "issueType", st.message, st.status, st.return_status as "returnStatus",
            st.created_at as "createdAt", o.order_code as "orderCode"
     FROM support_tickets st
     LEFT JOIN orders o ON o.id = st.order_id
     WHERE st.user_id = $1
     ORDER BY st.created_at DESC`, [userId]);
    return result.rows;
}
async function getAdminProducts() {
    const result = await pool_1.pool.query(`SELECT id, name, brand, category, flavor, servings, price, description, image, images, in_stock as "inStock", featured
     FROM products ORDER BY id ASC`);
    return result.rows;
}
async function createAdminProduct(input) {
    const result = await pool_1.pool.query(`INSERT INTO products (id, name, brand, category, flavor, servings, price, description, image, images, ingredients, usage, faqs, reviews, goals, in_stock, featured, certifications)
     VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM products), $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, '[]'::jsonb, ''::text, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, $10, $11, '[]'::jsonb)
     RETURNING id, name, brand, category, flavor, servings, price, description, image, images, in_stock as "inStock", featured`, [input.name, input.brand, input.category, input.flavor, input.servings, input.price, input.description, input.image, JSON.stringify(input.images), input.inStock, input.featured]);
    return result.rows[0];
}
async function getAdminOverview() {
    const [salesResult, ordersResult, usersResult, productsResult, lowStockResult, subscriptionsResult] = await Promise.all([
        pool_1.pool.query('SELECT COALESCE(SUM(total), 0) AS sales FROM orders'),
        pool_1.pool.query('SELECT COUNT(*)::int AS count FROM orders'),
        pool_1.pool.query('SELECT COUNT(*)::int AS count FROM users'),
        pool_1.pool.query('SELECT COUNT(*)::int AS count FROM products WHERE in_stock = true'),
        pool_1.pool.query('SELECT COUNT(*)::int AS count FROM products WHERE in_stock = false'),
        pool_1.pool.query('SELECT COUNT(*)::int AS count FROM orders WHERE subscription_frequency IS NOT NULL'),
    ]);
    return {
        totalSales: Number(salesResult.rows[0].sales),
        totalOrders: Number(ordersResult.rows[0].count),
        totalUsers: Number(usersResult.rows[0].count),
        activeProducts: Number(productsResult.rows[0].count),
        outOfStockProducts: Number(lowStockResult.rows[0].count),
        activeSubscriptions: Number(subscriptionsResult.rows[0].count),
    };
}
async function getAdminFunnelMetrics() {
    const [started, completed, verified, firstOrder, coupons] = await Promise.all([
        pool_1.pool.query(`SELECT COUNT(*)::int AS count FROM auth_events WHERE event_name = 'register_started'`),
        pool_1.pool.query(`SELECT COUNT(*)::int AS count FROM auth_events WHERE event_name = 'register_completed'`),
        pool_1.pool.query(`SELECT COUNT(*)::int AS count FROM auth_events WHERE event_name = 'verify_completed'`),
        pool_1.pool.query(`SELECT COUNT(*)::int AS count
       FROM (
         SELECT user_id
         FROM orders
         GROUP BY user_id
         HAVING MIN(created_at) IS NOT NULL
       ) q`),
        pool_1.pool.query(`SELECT COUNT(*)::int AS count FROM orders WHERE promo_code IS NOT NULL`),
    ]);
    return {
        registerStarted: Number(started.rows[0].count),
        registerCompleted: Number(completed.rows[0].count),
        verifyCompleted: Number(verified.rows[0].count),
        firstOrderUsers: Number(firstOrder.rows[0].count),
        couponOrders: Number(coupons.rows[0].count),
    };
}
async function getAdminOrders() {
    const result = await pool_1.pool.query(`SELECT o.id, o.order_code AS "orderCode", o.total, o.status, o.created_at AS "createdAt",
            o.subscription_frequency AS "subscriptionFrequency", u.name AS "customerName", u.email AS "customerEmail"
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC
     LIMIT 100`);
    return result.rows;
}
async function updateOrderStatus(id, status) {
    const result = await pool_1.pool.query(`UPDATE orders
     SET status = $2
     WHERE id = $1
     RETURNING id, order_code AS "orderCode", status`, [id, status]);
    return result.rows[0];
}
async function getAdminUsers() {
    const result = await pool_1.pool.query(`SELECT id, name, email, is_admin AS "isAdmin", created_at AS "createdAt"
     FROM users
     ORDER BY created_at DESC
     LIMIT 100`);
    return result.rows;
}
async function updateAdminProduct(id, input) {
    const result = await pool_1.pool.query(`UPDATE products SET
      name = COALESCE($2, name),
      category = COALESCE($3, category),
      description = COALESCE($4, description),
      image = COALESCE($5, image),
      brand = COALESCE($6, brand),
      flavor = COALESCE($7, flavor),
      servings = COALESCE($8, servings),
      images = COALESCE($9::jsonb, images),
      price = COALESCE($10, price),
      in_stock = COALESCE($11, in_stock),
      featured = COALESCE($12, featured)
     WHERE id = $1
     RETURNING id, name, brand, category, flavor, servings, price, description, image, images, in_stock as "inStock", featured`, [id, input.name, input.category, input.description, input.image, input.brand, input.flavor, input.servings, input.images ? JSON.stringify(input.images) : null, input.price, input.inStock, input.featured]);
    return result.rows[0];
}
