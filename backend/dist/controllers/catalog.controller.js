"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthController = healthController;
exports.listProductsController = listProductsController;
exports.getProductController = getProductController;
exports.listCategoriesController = listCategoriesController;
const catalog_service_1 = require("../services/catalog.service");
async function healthController(_req, res) {
    try {
        await (0, catalog_service_1.checkHealth)();
        res.json({ ok: true, message: 'Backend is running', database: 'connected' });
    }
    catch {
        res.status(503).json({ ok: false, message: 'Backend is running', database: 'disconnected' });
    }
}
async function listProductsController(req, res) {
    try {
        const products = await (0, catalog_service_1.listProducts)({
            search: String(req.query.search ?? '').trim(),
            minPrice: Number(req.query.minPrice ?? 0),
            maxPrice: Number(req.query.maxPrice ?? 99999),
            goal: String(req.query.goal ?? '').trim(),
            inStockOnly: String(req.query.inStock ?? 'false') === 'true',
            category: String(req.query.category ?? '').trim(),
        });
        res.json(products);
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to load products.' });
    }
}
async function getProductController(req, res) {
    try {
        const product = await (0, catalog_service_1.getProductDetails)(Number(req.params.id));
        if (!product) {
            res.status(404).json({ ok: false, message: 'Product not found' });
            return;
        }
        res.json(product);
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to load product details.' });
    }
}
async function listCategoriesController(_req, res) {
    try {
        const categories = await (0, catalog_service_1.listCategories)();
        res.json({ categories });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to load categories.' });
    }
}
