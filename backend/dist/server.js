"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const init_1 = require("./db/init");
const pool_1 = require("./db/pool");
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT ?? 4000);
const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
app.use((0, cors_1.default)({ origin: corsOrigins, credentials: true }));
app.use(express_1.default.json());
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
        const result = await pool_1.pool.query('SELECT id, name, category, price, description, image FROM products ORDER BY id ASC');
        res.json(result.rows);
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to load products.' });
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
    try {
        const items = (req.body?.items ?? []);
        if (!Array.isArray(items) || items.length === 0) {
            res.status(400).json({ ok: false, message: 'Cart is empty.' });
            return;
        }
        const ids = Array.from(new Set(items.map((item) => item.id)));
        const result = await pool_1.pool.query('SELECT id, price FROM products WHERE id = ANY($1::int[])', [ids]);
        const priceMap = new Map(result.rows.map((row) => [Number(row.id), Number(row.price)]));
        const total = items.reduce((sum, item) => {
            const price = priceMap.get(item.id);
            if (price === undefined)
                return sum;
            return sum + price * Math.max(1, item.quantity);
        }, 0);
        const itemCount = items.reduce((sum, item) => sum + Math.max(1, item.quantity), 0);
        res.json({ ok: true, orderId: `FF-${Date.now()}`, submittedAt: new Date().toISOString(), total: Number(total.toFixed(2)), itemCount });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Checkout failed.' });
    }
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
