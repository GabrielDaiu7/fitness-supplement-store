import { pool } from '../db/pool';

export async function getAccountOrders(userId?: number) {
  const orders = await pool.query(
    `SELECT id, order_code as "orderCode", subtotal, shipping, tax, discount, total, promo_code as "promoCode",
            subscription_frequency as "subscriptionFrequency", status, created_at as "createdAt"
     FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return orders.rows;
}

export async function getAccountOrderDetails(userId: number, orderCode: string) {
  const orderResult = await pool.query(
    `SELECT id, order_code as "orderCode", subtotal, shipping, tax, discount, total, promo_code as "promoCode",
            subscription_frequency as "subscriptionFrequency", status, created_at as "createdAt"
     FROM orders WHERE user_id = $1 AND order_code = $2`,
    [userId, orderCode]
  );
  const order = orderResult.rows[0];
  if (!order) return null;
  const items = await pool.query(
    `SELECT oi.product_id as "productId", p.name, oi.quantity, oi.unit_price as "unitPrice"
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1`,
    [order.id]
  );
  return { ...order, items: items.rows };
}

export async function getAccountAddresses(userId: number) {
  const result = await pool.query(
    `SELECT id, full_name as "fullName", email, address, city, zip, is_default as "isDefault"
     FROM addresses
     WHERE user_id = $1
     ORDER BY is_default DESC, id DESC`,
    [userId]
  );
  return result.rows;
}

export async function addAccountAddress(
  userId: number,
  input: { fullName: string; email: string; address: string; city: string; zip: string; isDefault: boolean }
) {
  if (input.isDefault) {
    await pool.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [userId]);
  }
  const result = await pool.query(
    `INSERT INTO addresses (user_id, full_name, email, address, city, zip, is_default)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, full_name as "fullName", email, address, city, zip, is_default as "isDefault"`,
    [userId, input.fullName, input.email, input.address, input.city, input.zip, input.isDefault]
  );
  return result.rows[0];
}

export async function getPaymentMethods(userId: number) {
  const result = await pool.query(
    `SELECT id, card_brand as "cardBrand", last4, exp_month as "expMonth", exp_year as "expYear", is_default as "isDefault"
     FROM payment_methods
     WHERE user_id = $1
     ORDER BY is_default DESC, id DESC`,
    [userId]
  );
  return result.rows;
}

export async function addPaymentMethod(
  userId: number,
  input: { cardBrand: string; cardNumber: string; expMonth: number; expYear: number; isDefault: boolean }
) {
  const digitsOnly = input.cardNumber.replace(/\D/g, '');
  const last4 = digitsOnly.slice(-4);
  if (input.isDefault) {
    await pool.query('UPDATE payment_methods SET is_default = false WHERE user_id = $1', [userId]);
  }
  const result = await pool.query(
    `INSERT INTO payment_methods (user_id, card_brand, last4, exp_month, exp_year, is_default)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, card_brand as "cardBrand", last4, exp_month as "expMonth", exp_year as "expYear", is_default as "isDefault"`,
    [userId, input.cardBrand, last4, input.expMonth, input.expYear, input.isDefault]
  );
  return result.rows[0];
}

export async function reorderFromPreviousOrder(userId: number, orderCode: string) {
  const order = await pool.query('SELECT id FROM orders WHERE user_id = $1 AND order_code = $2', [userId, orderCode]);
  if (!order.rows[0]) return null;
  const items = await pool.query(
    `SELECT oi.product_id as id, oi.quantity
     FROM order_items oi
     WHERE oi.order_id = $1`,
    [order.rows[0].id]
  );
  return items.rows as Array<{ id: number; quantity: number }>;
}

export async function createSupportTicket(
  userId: number,
  input: { orderCode?: string; issueType: string; message: string; returnRequested?: boolean }
) {
  let orderId: number | null = null;
  if (input.orderCode) {
    const order = await pool.query('SELECT id FROM orders WHERE user_id = $1 AND order_code = $2', [userId, input.orderCode]);
    orderId = order.rows[0]?.id ?? null;
  }
  const result = await pool.query(
    `INSERT INTO support_tickets (user_id, order_id, issue_type, message, return_status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, issue_type as "issueType", message, status, return_status as "returnStatus", created_at as "createdAt"`,
    [userId, orderId, input.issueType, input.message, input.returnRequested ? 'requested' : 'not_requested']
  );
  return result.rows[0];
}

export async function getSupportTickets(userId: number) {
  const result = await pool.query(
    `SELECT st.id, st.issue_type as "issueType", st.message, st.status, st.return_status as "returnStatus",
            st.created_at as "createdAt", o.order_code as "orderCode"
     FROM support_tickets st
     LEFT JOIN orders o ON o.id = st.order_id
     WHERE st.user_id = $1
     ORDER BY st.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getWishlistProducts(userId: number) {
  const result = await pool.query(
    `SELECT p.id, p.name, p.brand, p.category, p.flavor, p.servings, p.price, p.description, p.image, p.images,
            p.ingredients, p.usage, p.faqs, p.reviews, p.goals, p.in_stock as "inStock",
            p.stock_quantity as "stockQuantity", p.low_stock_threshold as "lowStockThreshold",
            p.featured, p.supplement_facts as "supplementFacts", p.certifications
     FROM wishlist_items wi
     JOIN products p ON p.id = wi.product_id
     WHERE wi.user_id = $1
     ORDER BY wi.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function addWishlistProduct(userId: number, productId: number) {
  await pool.query(
    `INSERT INTO wishlist_items (user_id, product_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, product_id) DO NOTHING`,
    [userId, productId]
  );
  return getWishlistProducts(userId);
}

export async function removeWishlistProduct(userId: number, productId: number) {
  await pool.query('DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2', [userId, productId]);
  return getWishlistProducts(userId);
}

export async function getAdminProducts() {
  const result = await pool.query(
    `SELECT id, name, brand, category, flavor, servings, price, description, image, images, in_stock as "inStock",
            stock_quantity as "stockQuantity", low_stock_threshold as "lowStockThreshold", featured,
            supplement_facts as "supplementFacts"
     FROM products ORDER BY id ASC`
  );
  return result.rows;
}

export async function createAdminProduct(input: {
  name: string;
  brand: string;
  category: string;
  flavor: string;
  servings: number;
  price: number;
  description: string;
  image: string;
    images: string[];
    inStock: boolean;
    stockQuantity: number;
    lowStockThreshold: number;
    featured: boolean;
    supplementFacts: Record<string, unknown>;
}) {
  const result = await pool.query(
    `INSERT INTO products (id, name, brand, category, flavor, servings, price, description, image, images, ingredients, usage, faqs, reviews, goals, in_stock, stock_quantity, low_stock_threshold, featured, supplement_facts, certifications)
     VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM products), $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, '[]'::jsonb, ''::text, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, $10, $11, $12, $13, $14::jsonb, '[]'::jsonb)
     RETURNING id, name, brand, category, flavor, servings, price, description, image, images, in_stock as "inStock",
               stock_quantity as "stockQuantity", low_stock_threshold as "lowStockThreshold", featured,
               supplement_facts as "supplementFacts"`,
    [
      input.name,
      input.brand,
      input.category,
      input.flavor,
      input.servings,
      input.price,
      input.description,
      input.image,
      JSON.stringify(input.images),
      input.inStock,
      input.stockQuantity,
      input.lowStockThreshold,
      input.featured,
      JSON.stringify(input.supplementFacts),
    ]
  );
  return result.rows[0];
}

export async function getAdminOverview() {
  const [salesResult, ordersResult, usersResult, productsResult, lowStockResult, subscriptionsResult] = await Promise.all([
    pool.query('SELECT COALESCE(SUM(total), 0) AS sales FROM orders'),
    pool.query('SELECT COUNT(*)::int AS count FROM orders'),
    pool.query('SELECT COUNT(*)::int AS count FROM users'),
    pool.query('SELECT COUNT(*)::int AS count FROM products WHERE in_stock = true'),
    pool.query('SELECT COUNT(*)::int AS count FROM products WHERE in_stock = false'),
    pool.query('SELECT COUNT(*)::int AS count FROM orders WHERE subscription_frequency IS NOT NULL'),
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

export async function getAdminFunnelMetrics() {
  const [started, completed, verified, firstOrder, coupons] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS count FROM auth_events WHERE event_name = 'register_started'`),
    pool.query(`SELECT COUNT(*)::int AS count FROM auth_events WHERE event_name = 'register_completed'`),
    pool.query(`SELECT COUNT(*)::int AS count FROM auth_events WHERE event_name = 'verify_completed'`),
    pool.query(
      `SELECT COUNT(*)::int AS count
       FROM (
         SELECT user_id
         FROM orders
         GROUP BY user_id
         HAVING MIN(created_at) IS NOT NULL
       ) q`
    ),
    pool.query(`SELECT COUNT(*)::int AS count FROM orders WHERE promo_code IS NOT NULL`),
  ]);
  return {
    registerStarted: Number(started.rows[0].count),
    registerCompleted: Number(completed.rows[0].count),
    verifyCompleted: Number(verified.rows[0].count),
    firstOrderUsers: Number(firstOrder.rows[0].count),
    couponOrders: Number(coupons.rows[0].count),
  };
}

export async function getAdminOrders() {
  const result = await pool.query(
    `SELECT o.id, o.order_code AS "orderCode", o.total, o.status, o.created_at AS "createdAt",
            o.subscription_frequency AS "subscriptionFrequency", u.name AS "customerName", u.email AS "customerEmail"
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC
     LIMIT 100`
  );
  return result.rows;
}

export async function updateOrderStatus(id: number, status: string) {
  const result = await pool.query(
    `UPDATE orders
     SET status = $2
     WHERE id = $1
     RETURNING id, order_code AS "orderCode", status`,
    [id, status]
  );
  return result.rows[0];
}

export async function getAdminUsers() {
  const result = await pool.query(
    `SELECT id, name, email, is_admin AS "isAdmin", created_at AS "createdAt"
     FROM users
     ORDER BY created_at DESC
     LIMIT 100`
  );
  return result.rows;
}

export async function getAdminCoupons() {
  const result = await pool.query(
    `SELECT id, code, description, discount_percent as "discountPercent", min_subtotal as "minSubtotal",
            active, expires_at as "expiresAt", created_at as "createdAt"
     FROM coupons
     ORDER BY active DESC, id DESC`
  );
  return result.rows;
}

export async function createAdminCoupon(input: {
  code: string;
  description: string;
  discountPercent: number;
  minSubtotal: number;
  active: boolean;
  expiresAt?: string | null;
}) {
  const result = await pool.query(
    `INSERT INTO coupons (code, description, discount_percent, min_subtotal, active, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, code, description, discount_percent as "discountPercent", min_subtotal as "minSubtotal",
               active, expires_at as "expiresAt", created_at as "createdAt"`,
    [
      input.code,
      input.description,
      input.discountPercent,
      input.minSubtotal,
      input.active,
      input.expiresAt || null,
    ]
  );
  return result.rows[0];
}

export async function updateAdminCoupon(
  id: number,
  input: {
    description: string | null;
    discountPercent: number | null;
    minSubtotal: number | null;
    active: boolean | null;
    expiresAt: string | null;
  }
) {
  const result = await pool.query(
    `UPDATE coupons SET
      description = COALESCE($2, description),
      discount_percent = COALESCE($3, discount_percent),
      min_subtotal = COALESCE($4, min_subtotal),
      active = COALESCE($5, active),
      expires_at = $6
     WHERE id = $1
     RETURNING id, code, description, discount_percent as "discountPercent", min_subtotal as "minSubtotal",
               active, expires_at as "expiresAt", created_at as "createdAt"`,
    [id, input.description, input.discountPercent, input.minSubtotal, input.active, input.expiresAt]
  );
  return result.rows[0];
}

export async function updateAdminProduct(
  id: number,
  input: {
    name: string | null;
    category: string | null;
    description: string | null;
    image: string | null;
    brand: string | null;
    flavor: string | null;
    servings: number | null;
    images: string[] | null;
    price: number | null;
    inStock: boolean | null;
    stockQuantity: number | null;
    lowStockThreshold: number | null;
    featured: boolean | null;
    supplementFacts: Record<string, unknown> | null;
  }
) {
  const result = await pool.query(
    `UPDATE products SET
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
      stock_quantity = COALESCE($12, stock_quantity),
      low_stock_threshold = COALESCE($13, low_stock_threshold),
      featured = COALESCE($14, featured),
      supplement_facts = COALESCE($15::jsonb, supplement_facts)
     WHERE id = $1
     RETURNING id, name, brand, category, flavor, servings, price, description, image, images, in_stock as "inStock",
               stock_quantity as "stockQuantity", low_stock_threshold as "lowStockThreshold", featured,
               supplement_facts as "supplementFacts"`,
    [
      id,
      input.name,
      input.category,
      input.description,
      input.image,
      input.brand,
      input.flavor,
      input.servings,
      input.images ? JSON.stringify(input.images) : null,
      input.price,
      input.inStock,
      input.stockQuantity,
      input.lowStockThreshold,
      input.featured,
      input.supplementFacts ? JSON.stringify(input.supplementFacts) : null,
    ]
  );
  return result.rows[0];
}
