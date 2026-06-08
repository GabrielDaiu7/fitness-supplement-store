"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutController = checkoutController;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../config/auth");
const auth_service_1 = require("../services/auth.service");
const checkout_service_1 = require("../services/checkout.service");
async function checkoutController(req, res) {
    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) {
        res.status(401).json({ ok: false, message: 'Please login before checkout.' });
        return;
    }
    try {
        const user = jsonwebtoken_1.default.verify(token, auth_1.JWT_ACCESS_SECRET);
        const emailVerified = await (0, auth_service_1.isUserEmailVerified)(user.id);
        if (!emailVerified) {
            res.status(403).json({ ok: false, message: 'Please verify your email before checkout.' });
            return;
        }
        const rawItems = (req.body?.items ?? []);
        const promoCode = String(req.body?.promoCode ?? '').toUpperCase().trim();
        const shippingInput = req.body?.shipping;
        const subscribeFrequency = req.body?.subscribeFrequency;
        const shippingMethod = String(req.body?.shippingMethod ?? 'standard');
        const bundleCode = String(req.body?.bundleCode ?? '').trim().toUpperCase();
        if (!Array.isArray(rawItems) || rawItems.length === 0) {
            res.status(400).json({ ok: false, message: 'Cart is empty.' });
            return;
        }
        if (rawItems.some((item) => !Number.isInteger(Number(item.id)) ||
            !Number.isInteger(Number(item.quantity)) ||
            Number(item.id) <= 0 ||
            Number(item.quantity) <= 0)) {
            res.status(400).json({ ok: false, message: 'Cart contains invalid quantities.' });
            return;
        }
        const items = rawItems.map((item) => ({ id: Number(item.id), quantity: Number(item.quantity) }));
        if (!shippingInput) {
            res.status(400).json({ ok: false, message: 'Shipping address is required.' });
            return;
        }
        if (!shippingInput.fullName?.trim() ||
            !shippingInput.email?.trim() ||
            !shippingInput.address?.trim() ||
            !shippingInput.city?.trim() ||
            !shippingInput.zip?.trim()) {
            res.status(400).json({ ok: false, message: 'Complete shipping details are required.' });
            return;
        }
        if (!['standard', 'express'].includes(shippingMethod)) {
            res.status(400).json({ ok: false, message: 'Invalid shipping method.' });
            return;
        }
        const result = await (0, checkout_service_1.createCheckoutOrder)({
            userId: user.id,
            items,
            promoCode,
            shipping: shippingInput,
            subscribeFrequency,
            shippingMethod,
            bundleCode,
        });
        res.json({
            ok: true,
            orderId: result.orderCode,
            submittedAt: new Date().toISOString(),
            subtotal: result.subtotal,
            shipping: result.shipping,
            tax: result.tax,
            discount: result.discount,
            total: result.total,
            itemCount: result.itemCount,
            addressId: result.addressId,
            emailSent: true,
        });
    }
    catch (error) {
        if (error instanceof checkout_service_1.CheckoutValidationError) {
            res.status(400).json({ ok: false, message: error.message });
            return;
        }
        res.status(500).json({ ok: false, message: 'Checkout failed.' });
    }
}
