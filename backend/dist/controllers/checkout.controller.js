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
        const result = await (0, checkout_service_1.createCheckoutOrder)({
            userId: user.id,
            items,
            promoCode,
            shipping: shippingInput,
            subscribeFrequency,
            shippingMethod,
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
    catch {
        res.status(500).json({ ok: false, message: 'Checkout failed.' });
    }
}
