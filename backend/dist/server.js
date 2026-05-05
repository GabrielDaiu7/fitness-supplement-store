"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const init_1 = require("./db/init");
const pool_1 = require("./db/pool");
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT ?? 4000);
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'access-dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'refresh-dev-secret';
const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
app.use((0, cors_1.default)({ origin: corsOrigins, credentials: true }));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
function createAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '15m' });
}
function createRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '14d' });
}
function authGuard(req, res, next) {
    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) {
        res.status(401).json({ ok: false, message: 'Unauthorized' });
        return;
    }
    try {
        req.user = jsonwebtoken_1.default.verify(token, JWT_ACCESS_SECRET);
        next();
    }
    catch {
        res.status(401).json({ ok: false, message: 'Session expired' });
    }
}
function adminGuard(req, res, next) {
    if (!req.user?.isAdmin) {
        res.status(403).json({ ok: false, message: 'Admin access required' });
        return;
    }
    next();
}
app.get('/api/health', async (_req, res) => {
    try {
        await pool_1.pool.query('SELECT 1');
        res.json({ ok: true, message: 'Backend is running', database: 'connected' });
    }
    catch {
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
        const filters = ['price BETWEEN $1 AND $2'];
        const params = [minPrice, maxPrice];
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
        const result = await pool_1.pool.query(`SELECT id, name, category, price, description, image, ingredients, usage, faqs, reviews, goals, in_stock as "inStock",
              featured, certifications
       FROM products
       WHERE ${filters.join(' AND ')}
       ORDER BY featured DESC, id ASC`, params);
        res.json(result.rows);
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to load products.' });
    }
});
app.get('/api/products/:id', async (req, res) => {
    try {
        const productId = Number(req.params.id);
        const productResult = await pool_1.pool.query(`SELECT id, name, category, price, description, image, ingredients, usage, faqs, reviews, goals, in_stock as "inStock",
              featured, certifications
       FROM products WHERE id = $1`, [productId]);
        const product = productResult.rows[0];
        if (!product) {
            res.status(404).json({ ok: false, message: 'Product not found' });
            return;
        }
        const related = await pool_1.pool.query(`SELECT id, name, category, price, description, image, ingredients, usage, faqs, reviews, goals, in_stock as "inStock",
              featured, certifications
       FROM products
       WHERE category = $1 AND id != $2
       ORDER BY featured DESC, id ASC
       LIMIT 4`, [product.category, productId]);
        res.json({ ...product, relatedProducts: related.rows });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to load product details.' });
    }
});
app.get('/api/categories', async (_req, res) => {
    try {
        const result = await pool_1.pool.query('SELECT DISTINCT category FROM products ORDER BY category ASC');
        res.json({ categories: result.rows.map((row) => row.category) });
    }
    catch {
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
        const user = jsonwebtoken_1.default.verify(token, JWT_ACCESS_SECRET);
        const items = (req.body?.items ?? []);
        const promoCode = String(req.body?.promoCode ?? '').toUpperCase().trim();
        const shippingInput = req.body?.shipping;
        const subscribeFrequency = req.body?.subscribeFrequency;
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
        const result = await pool_1.pool.query('SELECT id, price FROM products WHERE id = ANY($1::int[])', [ids]);
        const priceMap = new Map(result.rows.map((row) => [Number(row.id), Number(row.price)]));
        const subtotal = items.reduce((sum, item) => {
            const price = priceMap.get(item.id);
            if (price === undefined)
                return sum;
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
        const addressResult = await pool_1.pool.query(`INSERT INTO addresses (user_id, full_name, email, address, city, zip, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id`, [user.id, shippingInput.fullName, shippingInput.email, shippingInput.address, shippingInput.city, shippingInput.zip]);
        const orderResult = await pool_1.pool.query(`INSERT INTO orders (user_id, order_code, subtotal, shipping, tax, discount, total, promo_code, subscription_frequency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`, [
            user.id,
            orderCode,
            Number(subtotal.toFixed(2)),
            Number(shipping.toFixed(2)),
            Number(tax.toFixed(2)),
            Number(discount.toFixed(2)),
            Number(total.toFixed(2)),
            promoCode || null,
            subscribeFrequency || null,
        ]);
        const orderId = Number(orderResult.rows[0].id);
        for (const item of items) {
            const unitPrice = priceMap.get(item.id);
            if (unitPrice === undefined)
                continue;
            await pool_1.pool.query(`INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`, [orderId, item.id, Math.max(1, item.quantity), unitPrice]);
        }
        const transport = nodemailer_1.default.createTransport({
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
    }
    catch {
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
        const existing = await pool_1.pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            res.status(409).json({ ok: false, message: 'Email already exists' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const result = await pool_1.pool.query(`INSERT INTO users (name, email, password_hash, is_admin)
       VALUES ($1, $2, $3, false)
       RETURNING id, name, email, is_admin as "isAdmin"`, [name, email, passwordHash]);
        const user = result.rows[0];
        const accessToken = createAccessToken({ id: user.id, email: user.email, isAdmin: user.isAdmin });
        const refreshToken = createRefreshToken({ id: user.id, email: user.email, isAdmin: user.isAdmin });
        await pool_1.pool.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, now() + interval \'14 days\')', [user.id, refreshToken]);
        res.cookie('fusion_refresh', refreshToken, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 14 * 24 * 60 * 60 * 1000 });
        res.json({ ok: true, accessToken, user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Registration failed' });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const email = String(req.body?.email ?? '').trim().toLowerCase();
        const password = String(req.body?.password ?? '').trim();
        const result = await pool_1.pool.query(`SELECT id, name, email, password_hash, is_admin as "isAdmin" FROM users WHERE email = $1`, [email]);
        const user = result.rows[0];
        if (!user) {
            res.status(401).json({ ok: false, message: 'Invalid credentials' });
            return;
        }
        const validPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!validPassword) {
            res.status(401).json({ ok: false, message: 'Invalid credentials' });
            return;
        }
        const payload = { id: user.id, email: user.email, isAdmin: user.isAdmin };
        const accessToken = createAccessToken(payload);
        const refreshToken = createRefreshToken(payload);
        await pool_1.pool.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, now() + interval \'14 days\')', [user.id, refreshToken]);
        res.cookie('fusion_refresh', refreshToken, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 14 * 24 * 60 * 60 * 1000 });
        res.json({ ok: true, accessToken, user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Login failed' });
    }
});
app.post('/api/auth/refresh', async (req, res) => {
    try {
        const token = req.cookies?.fusion_refresh;
        if (!token) {
            res.json({ ok: false });
            return;
        }
        const payload = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
        const tokenResult = await pool_1.pool.query('SELECT id FROM refresh_tokens WHERE token = $1 AND expires_at > now()', [token]);
        if (!tokenResult.rows.length) {
            res.json({ ok: false });
            return;
        }
        const accessToken = createAccessToken(payload);
        res.json({ ok: true, accessToken });
    }
    catch {
        res.json({ ok: false });
    }
});
app.post('/api/auth/logout', async (req, res) => {
    const token = req.cookies?.fusion_refresh;
    if (token) {
        await pool_1.pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
    }
    res.clearCookie('fusion_refresh');
    res.json({ ok: true });
});
app.get('/api/auth/me', authGuard, async (req, res) => {
    try {
        const result = await pool_1.pool.query(`SELECT id, name, email, is_admin as "isAdmin" FROM users WHERE id = $1`, [req.user?.id]);
        res.json({ ok: true, user: result.rows[0] });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to load profile' });
    }
});
app.get('/api/account/orders', authGuard, async (req, res) => {
    try {
        const orders = await pool_1.pool.query(`SELECT id, order_code as "orderCode", subtotal, shipping, tax, discount, total, promo_code as "promoCode",
              subscription_frequency as "subscriptionFrequency", status, created_at as "createdAt"
       FROM orders WHERE user_id = $1 ORDER BY created_at DESC`, [req.user?.id]);
        res.json({ ok: true, orders: orders.rows });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to load orders' });
    }
});
app.get('/api/admin/products', authGuard, adminGuard, async (_req, res) => {
    const result = await pool_1.pool.query(`SELECT id, name, category, price, description, image, in_stock as "inStock", featured
     FROM products ORDER BY id ASC`);
    res.json({ ok: true, products: result.rows });
});
app.patch('/api/admin/products/:id', authGuard, adminGuard, async (req, res) => {
    const id = Number(req.params.id);
    const price = Number(req.body?.price);
    const inStock = Boolean(req.body?.inStock);
    const featured = Boolean(req.body?.featured);
    const result = await pool_1.pool.query(`UPDATE products SET
      price = COALESCE($2, price),
      in_stock = COALESCE($3, in_stock),
      featured = COALESCE($4, featured)
     WHERE id = $1
     RETURNING id, name, category, price, in_stock as "inStock", featured`, [id, Number.isFinite(price) ? price : null, req.body?.inStock ?? null, req.body?.featured ?? null]);
    res.json({ ok: true, product: result.rows[0] });
});
async function startServer() {
    await (0, init_1.initSchema)();
    app.listen(PORT, () => {
        console.log(`API running at http://localhost:${PORT}`);
    });
}
startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exitCode = 1;
});
