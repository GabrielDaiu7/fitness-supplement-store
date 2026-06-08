"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthController = healthController;
exports.listProductsController = listProductsController;
exports.getProductController = getProductController;
exports.listCategoriesController = listCategoriesController;
exports.newsletterSubscribeController = newsletterSubscribeController;
exports.productReviewController = productReviewController;
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
async function newsletterSubscribeController(req, res) {
    try {
        const email = String(req.body?.email ?? '').trim().toLowerCase();
        const source = String(req.body?.source ?? 'footer').trim() || 'footer';
        if (!email || !email.includes('@')) {
            res.status(400).json({ ok: false, message: 'Valid email is required.' });
            return;
        }
        const subscription = await (0, catalog_service_1.subscribeNewsletter)(email, source);
        res.status(201).json({
            ok: true,
            message: 'Newsletter signup saved.',
            subscription,
        });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to save newsletter signup.' });
    }
}
async function productReviewController(req, res) {
    try {
        if (!req.user?.id) {
            res.status(401).json({ ok: false, message: 'Unauthorized' });
            return;
        }
        const productId = Number(req.params.id);
        const rating = Number(req.body?.rating);
        const text = String(req.body?.text ?? '').trim();
        if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(rating) || rating < 1 || rating > 5 || text.length < 5) {
            res.status(400).json({ ok: false, message: 'Rating and review text are required.' });
            return;
        }
        const review = await (0, catalog_service_1.createVerifiedProductReview)(req.user.id, productId, rating, text);
        if (!review) {
            res.status(403).json({ ok: false, message: 'Only verified buyers can review this product.' });
            return;
        }
        res.status(201).json({ ok: true, review });
    }
    catch {
        res.status(500).json({ ok: false, message: 'Failed to save review.' });
    }
}
