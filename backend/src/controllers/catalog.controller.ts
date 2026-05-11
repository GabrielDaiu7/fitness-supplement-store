import express from 'express';
import { checkHealth, getProductDetails, listCategories, listProducts } from '../services/catalog.service';

export async function healthController(_req: express.Request, res: express.Response) {
  try {
    await checkHealth();
    res.json({ ok: true, message: 'Backend is running', database: 'connected' });
  } catch {
    res.status(503).json({ ok: false, message: 'Backend is running', database: 'disconnected' });
  }
}

export async function listProductsController(req: express.Request, res: express.Response) {
  try {
    const products = await listProducts({
      search: String(req.query.search ?? '').trim(),
      minPrice: Number(req.query.minPrice ?? 0),
      maxPrice: Number(req.query.maxPrice ?? 99999),
      goal: String(req.query.goal ?? '').trim(),
      inStockOnly: String(req.query.inStock ?? 'false') === 'true',
      category: String(req.query.category ?? '').trim(),
    });
    res.json(products);
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load products.' });
  }
}

export async function getProductController(req: express.Request, res: express.Response) {
  try {
    const product = await getProductDetails(Number(req.params.id));
    if (!product) {
      res.status(404).json({ ok: false, message: 'Product not found' });
      return;
    }
    res.json(product);
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load product details.' });
  }
}

export async function listCategoriesController(_req: express.Request, res: express.Response) {
  try {
    const categories = await listCategories();
    res.json({ categories });
  } catch {
    res.status(500).json({ ok: false, message: 'Failed to load categories.' });
  }
}
