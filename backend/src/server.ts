import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { initSchema } from './db/init';
import { pool } from './db/pool';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'access-dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'refresh-dev-secret';
const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

type CheckoutItem = {
  id: number;
  quantity: number;
};

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

type AuthPayload = {
  id: number;
  email: string;
  isAdmin: boolean;
};

type AuthedRequest = express.Request & {
  user?: AuthPayload;
};

function createAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

function createRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '14d' });
}

function authGuard(req: AuthedRequest, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) {
    res.status(401).json({ ok: false, message: 'Unauthorized' });
    return;
  }
  try {
    req.user = jwt.verify(token, JWT_ACCESS_SECRET) as AuthPayload;
    next();
  } catch {
    res.status(401).json({ ok: false, message: 'Session expired' });
  }
}

function adminGuard(req: AuthedRequest, res: express.Response, next: express.NextFunction) {
  if (!req.user?.isAdmin) {
    res.status(403).json({ ok: false, message: 'Admin access required' });
    return;
  }
  next();
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, message: 'Backend is running', database: 'connected' });
  } catch {
    res.status(503).json({ ok: false, message: 'Backend is running', database: 'disconnected' });
  }
});

app.get('/api/products', async (_req, res) => {
  try {
    const search = String(_req.query.search ?? '').trim();
    const minPrice = Number(_req.query.minPrice ?? 0);
    const maxPrice = Number(_req.query.maxPrice ?? 99999);
    const goal = String(_req.query.goal ?? '').trim();
    const inStockOnly = String(_req.query.inStock ?? 'false') === 'true';
    const category = String(_req.query.category ?? '').trim();

    const filters: string[] = ['price BETWEEN $1 AND $2'];
    const params: unknown[] = [minPrice, maxPrice];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      filters.push(`LOWER(name) LIKE $${params.length}`);
    }
    if (goal) {
      params.push(goal.toLowerCase());
      filters.push(`goals @> to_jsonb(ARRAY[$${params.length}]::text[])`);
    }
    if (inStockOnly) {
      filters.push('in_stock = true');
    }
    if (category) {
      params.push(category);
      filters.push(`category = $${params.length}`);
    }

    const result = await pool.query(
      `SELECT id, name, category, price, description, image, ingredients, usage, faqs, reviews, goals, in_stock as "inStock",
              featured, certifications
       FROM products
       WHERE ${filters.join(' AND ')}
       ORDER BY featured DESC, id ASC`,
      params
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load products.' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const productResult = await pool.query(
      `SELECT id, name, category, price, description, image, ingredients, usage, faqs, reviews, goals, in_stock as "inStock",
              featured, certifications
       FROM products WHERE id = $1`,
      [productId]
    );
    const product = productResult.rows[0];
    if (!product) {
      res.status(404).json({ ok: false, message: 'Product not found' });
      return;
    }
    const related = await pool.query(
      `SELECT id, name, category, price, description, image, ingredients, usage, faqs, reviews, goals, in_stock as "inStock",
              featured, certifications
       FROM products
       WHERE category = $1 AND id != $2
       ORDER BY featured DESC, id ASC
       LIMIT 4`,
      [product.category, productId]
    );
    res.json({ ...product, relatedProducts: related.rows });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load product details.' });
  }
});

app.get('/api/categories', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM products ORDER BY category ASC'
    );
    res.json({ categories: result.rows.map((row) => row.category as string) });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load categories.' });
  }
});

app.post('/api/checkout', async (req, res) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) {
    res.status(401).json({ ok: false, message: 'Please login before checkout.' });
    return;
  }
  try {
    const user = jwt.verify(token, JWT_ACCESS_SECRET) as AuthPayload;
    const items = (req.body?.items ?? []) as CheckoutItem[];
    const promoCode = String(req.body?.promoCode ?? '').toUpperCase().trim();
    const shippingInput = req.body?.shipping as
      | { fullName: string; email: string; address: string; city: string; zip: string }
      | undefined;
    const subscribeFrequency = req.body?.subscribeFrequency as string | undefined;
    const shippingMethod = String(req.body?.shippingMethod ?? 'standard');

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ ok: false, message: 'Cart is empty.' });
      return;
    }
    if (!shippingInput) {
      res.status(400).json({ ok: false, message: 'Shipping address is required.' });
      return;
    }

    const ids = Array.from(new Set(items.map((item) => item.id)));
    const result = await pool.query(
      'SELECT id, price FROM products WHERE id = ANY($1::int[])',
      [ids]
    );
    const priceMap = new Map<number, number>(
      result.rows.map((row) => [Number(row.id), Number(row.price)])
    );

    const subtotal = items.reduce((sum, item) => {
      const price = priceMap.get(item.id);
      if (price === undefined) return sum;
      return sum + price * Math.max(1, item.quantity);
    }, 0);
    const discountRate = promoCode === 'FUSION10' ? 0.1 : 0;
    const discount = subtotal * discountRate;
    const discountedSubtotal = subtotal - discount;
    const shipping = shippingMethod === 'express' ? 12.5 : discountedSubtotal >= 70 ? 0 : 5.99;
    const tax = discountedSubtotal * 0.08;
    const total = discountedSubtotal + shipping + tax;
    const itemCount = items.reduce((sum, item) => sum + Math.max(1, item.quantity), 0);
    const orderCode = `FU-${Date.now()}`;

    const addressResult = await pool.query(
      `INSERT INTO addresses (user_id, full_name, email, address, city, zip, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id`,
      [user.id, shippingInput.fullName, shippingInput.email, shippingInput.address, shippingInput.city, shippingInput.zip]
    );

    const orderResult = await pool.query(
      `INSERT INTO orders (user_id, order_code, subtotal, shipping, tax, discount, total, promo_code, subscription_frequency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        user.id,
        orderCode,
        Number(subtotal.toFixed(2)),
        Number(shipping.toFixed(2)),
        Number(tax.toFixed(2)),
        Number(discount.toFixed(2)),
        Number(total.toFixed(2)),
        promoCode || null,
        subscribeFrequency || null,
      ]
    );
    const orderId = Number(orderResult.rows[0].id);

    for (const item of items) {
      const unitPrice = priceMap.get(item.id);
      if (unitPrice === undefined) continue;
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.id, Math.max(1, item.quantity), unitPrice]
      );
    }

    const transport = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
    await transport.sendMail({
      from: 'no-reply@fusion.store',
      to: shippingInput.email,
      subject: `Fusion Order Confirmation ${orderCode}`,
      text: `Your order ${orderCode} has been confirmed. Total: $${total.toFixed(2)}`,
    });

    res.json({
      ok: true,
      orderId: orderCode,
      submittedAt: new Date().toISOString(),
      subtotal: Number(subtotal.toFixed(2)),
      shipping: Number(shipping.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      total: Number(total.toFixed(2)),
      itemCount,
      addressId: Number(addressResult.rows[0].id),
      emailSent: true,
    });
  } catch {
    res.status(500).json({ ok: false, message: 'Checkout failed.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const name = String(req.body?.name ?? '').trim();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '').trim();
    if (!name || !email || password.length < 6) {
      res.status(400).json({ ok: false, message: 'Invalid registration payload' });
      return;
    }
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ ok: false, message: 'Email already exists' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, is_admin)
       VALUES ($1, $2, $3, false)
       RETURNING id, name, email, is_admin as "isAdmin"`,
      [name, email, passwordHash]
    );
    const user = result.rows[0] as AuthPayload & { name: string };
    const accessToken = createAccessToken({ id: user.id, email: user.email, isAdmin: user.isAdmin });
    const refreshToken = createRefreshToken({ id: user.id, email: user.email, isAdmin: user.isAdmin });
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, now() + interval \'14 days\')',
      [user.id, refreshToken]
    );
    res.cookie('fusion_refresh', refreshToken, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 14 * 24 * 60 * 60 * 1000 });
    res.json({ ok: true, accessToken, user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
  } catch {
    res.status(500).json({ ok: false, message: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '').trim();
    const result = await pool.query(
      `SELECT id, name, email, password_hash, is_admin as "isAdmin" FROM users WHERE email = $1`,
      [email]
    );
    const user = result.rows[0] as { id: number; name: string; email: string; password_hash: string; isAdmin: boolean } | undefined;
    if (!user) {
      res.status(401).json({ ok: false, message: 'Invalid credentials' });
      return;
    }
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ ok: false, message: 'Invalid credentials' });
      return;
    }
    const payload = { id: user.id, email: user.email, isAdmin: user.isAdmin };
    const accessToken = createAccessToken(payload);
    const refreshToken = createRefreshToken(payload);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, now() + interval \'14 days\')',
      [user.id, refreshToken]
    );
    res.cookie('fusion_refresh', refreshToken, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 14 * 24 * 60 * 60 * 1000 });
    res.json({ ok: true, accessToken, user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
  } catch {
    res.status(500).json({ ok: false, message: 'Login failed' });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const token = req.cookies?.fusion_refresh as string | undefined;
    if (!token) {
      res.json({ ok: false });
      return;
    }
    const payload = jwt.verify(token, JWT_REFRESH_SECRET) as AuthPayload;
    const tokenResult = await pool.query('SELECT id FROM refresh_tokens WHERE token = $1 AND expires_at > now()', [token]);
    if (!tokenResult.rows.length) {
      res.json({ ok: false });
      return;
    }
    const accessToken = createAccessToken(payload);
    res.json({ ok: true, accessToken });
  } catch {
    res.json({ ok: false });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  const token = req.cookies?.fusion_refresh as string | undefined;
  if (token) {
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
  }
  res.clearCookie('fusion_refresh');
  res.json({ ok: true });
});

app.get('/api/auth/me', authGuard, async (req: AuthedRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, is_admin as "isAdmin" FROM users WHERE id = $1`,
      [req.user?.id]
    );
    res.json({ ok: true, user: result.rows[0] });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load profile' });
  }
});

app.get('/api/account/orders', authGuard, async (req: AuthedRequest, res) => {
  try {
    const orders = await pool.query(
      `SELECT id, order_code as "orderCode", subtotal, shipping, tax, discount, total, promo_code as "promoCode",
              subscription_frequency as "subscriptionFrequency", status, created_at as "createdAt"
       FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user?.id]
    );
    res.json({ ok: true, orders: orders.rows });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load orders' });
  }
});

app.get('/api/admin/products', authGuard, adminGuard, async (_req, res) => {
  const result = await pool.query(
    `SELECT id, name, category, price, description, image, in_stock as "inStock", featured
     FROM products ORDER BY id ASC`
  );
  res.json({ ok: true, products: result.rows });
});

app.get('/api/admin/overview', authGuard, adminGuard, async (_req, res) => {
  try {
    const [salesResult, ordersResult, usersResult, productsResult, lowStockResult, subscriptionsResult] =
      await Promise.all([
        pool.query(`SELECT COALESCE(SUM(total), 0) AS sales FROM orders`),
        pool.query(`SELECT COUNT(*)::int AS count FROM orders`),
        pool.query(`SELECT COUNT(*)::int AS count FROM users`),
        pool.query(`SELECT COUNT(*)::int AS count FROM products WHERE in_stock = true`),
        pool.query(`SELECT COUNT(*)::int AS count FROM products WHERE in_stock = false`),
        pool.query(`SELECT COUNT(*)::int AS count FROM orders WHERE subscription_frequency IS NOT NULL`),
      ]);

    res.json({
      ok: true,
      metrics: {
        totalSales: Number(salesResult.rows[0].sales),
        totalOrders: Number(ordersResult.rows[0].count),
        totalUsers: Number(usersResult.rows[0].count),
        activeProducts: Number(productsResult.rows[0].count),
        outOfStockProducts: Number(lowStockResult.rows[0].count),
        activeSubscriptions: Number(subscriptionsResult.rows[0].count),
      },
    });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load admin overview' });
  }
});

app.get('/api/admin/orders', authGuard, adminGuard, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.id, o.order_code AS "orderCode", o.total, o.status, o.created_at AS "createdAt",
              o.subscription_frequency AS "subscriptionFrequency", u.name AS "customerName", u.email AS "customerEmail"
       FROM orders o
       JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC
       LIMIT 100`
    );
    res.json({ ok: true, orders: result.rows });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load admin orders' });
  }
});

app.patch('/api/admin/orders/:id/status', authGuard, adminGuard, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = String(req.body?.status ?? '').trim().toLowerCase();
    if (!['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      res.status(400).json({ ok: false, message: 'Invalid order status' });
      return;
    }
    const result = await pool.query(
      `UPDATE orders
       SET status = $2
       WHERE id = $1
       RETURNING id, order_code AS "orderCode", status`,
      [id, status]
    );
    res.json({ ok: true, order: result.rows[0] });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to update order status' });
  }
});

app.get('/api/admin/users', authGuard, adminGuard, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, is_admin AS "isAdmin", created_at AS "createdAt"
       FROM users
       ORDER BY created_at DESC
       LIMIT 100`
    );
    res.json({ ok: true, users: result.rows });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load admin users' });
  }
});

app.patch('/api/admin/products/:id', authGuard, adminGuard, async (req, res) => {
  const id = Number(req.params.id);
  const price = Number(req.body?.price);
  const inStock = Boolean(req.body?.inStock);
  const featured = Boolean(req.body?.featured);
  const result = await pool.query(
    `UPDATE products SET
      price = COALESCE($2, price),
      in_stock = COALESCE($3, in_stock),
      featured = COALESCE($4, featured)
     WHERE id = $1
     RETURNING id, name, category, price, in_stock as "inStock", featured`,
    [id, Number.isFinite(price) ? price : null, req.body?.inStock ?? null, req.body?.featured ?? null]
  );
  res.json({ ok: true, product: result.rows[0] });
});

async function startServer() {
  await initSchema();

  app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exitCode = 1;
});
