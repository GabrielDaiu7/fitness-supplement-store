import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { initSchema } from './db/init';
import { pool } from './db/pool';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
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
    const result = await pool.query(
      'SELECT id, name, category, price, description, image FROM products ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load products.' });
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
  try {
    const items = (req.body?.items ?? []) as CheckoutItem[];

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ ok: false, message: 'Cart is empty.' });
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

    const total = items.reduce((sum, item) => {
      const price = priceMap.get(item.id);
      if (price === undefined) return sum;
      return sum + price * Math.max(1, item.quantity);
    }, 0);

    const itemCount = items.reduce((sum, item) => sum + Math.max(1, item.quantity), 0);

    res.json({ ok: true, orderId: `FF-${Date.now()}`, submittedAt: new Date().toISOString(), total: Number(total.toFixed(2)), itemCount });
  } catch {
    res.status(500).json({ ok: false, message: 'Checkout failed.' });
  }
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
