"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutOrder = createCheckoutOrder;
const nodemailer_1 = __importDefault(require("nodemailer"));
const pool_1 = require("../db/pool");
async function createCheckoutOrder(input) {
    const ids = Array.from(new Set(input.items.map((item) => item.id)));
    const result = await pool_1.pool.query('SELECT id, price FROM products WHERE id = ANY($1::int[])', [ids]);
    const priceMap = new Map(result.rows.map((row) => [Number(row.id), Number(row.price)]));
    const subtotal = input.items.reduce((sum, item) => {
        const price = priceMap.get(item.id);
        if (price === undefined)
            return sum;
        return sum + price * Math.max(1, item.quantity);
    }, 0);
    const discountRate = input.promoCode === 'FUSION10' ? 0.1 : 0;
    const discount = subtotal * discountRate;
    const discountedSubtotal = subtotal - discount;
    const shippingCost = input.shippingMethod === 'express' ? 12.5 : discountedSubtotal >= 70 ? 0 : 5.99;
    const tax = discountedSubtotal * 0.08;
    const total = discountedSubtotal + shippingCost + tax;
    const itemCount = input.items.reduce((sum, item) => sum + Math.max(1, item.quantity), 0);
    const orderCode = `FU-${Date.now()}`;
    const addressResult = await pool_1.pool.query(`INSERT INTO addresses (user_id, full_name, email, address, city, zip, is_default)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     RETURNING id`, [input.userId, input.shipping.fullName, input.shipping.email, input.shipping.address, input.shipping.city, input.shipping.zip]);
    const orderResult = await pool_1.pool.query(`INSERT INTO orders (user_id, order_code, subtotal, shipping, tax, discount, total, promo_code, subscription_frequency)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`, [
        input.userId,
        orderCode,
        Number(subtotal.toFixed(2)),
        Number(shippingCost.toFixed(2)),
        Number(tax.toFixed(2)),
        Number(discount.toFixed(2)),
        Number(total.toFixed(2)),
        input.promoCode || null,
        input.subscribeFrequency || null,
    ]);
    const orderId = Number(orderResult.rows[0].id);
    for (const item of input.items) {
        const unitPrice = priceMap.get(item.id);
        if (unitPrice === undefined)
            continue;
        await pool_1.pool.query(`INSERT INTO order_items (order_id, product_id, quantity, unit_price)
       VALUES ($1, $2, $3, $4)`, [orderId, item.id, Math.max(1, item.quantity), unitPrice]);
    }
    const transport = nodemailer_1.default.createTransport({ streamTransport: true, newline: 'unix', buffer: true });
    await transport.sendMail({
        from: 'no-reply@fusion.store',
        to: input.shipping.email,
        subject: `Fusion Order Confirmation ${orderCode}`,
        text: `Your order ${orderCode} has been confirmed. Total: $${total.toFixed(2)}`,
    });
    const userResult = await pool_1.pool.query('SELECT email FROM users WHERE id = $1', [input.userId]);
    const userEmail = userResult.rows[0]?.email;
    if (userEmail) {
        await pool_1.pool.query(`INSERT INTO email_jobs (user_id, email, job_type, payload, run_at)
       VALUES ($1, $2, 'reorder_reminder', $3::jsonb, now() + interval '30 days')`, [input.userId, userEmail, JSON.stringify({ orderCode })]);
    }
    return {
        orderCode,
        subtotal: Number(subtotal.toFixed(2)),
        shipping: Number(shippingCost.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        total: Number(total.toFixed(2)),
        itemCount,
        addressId: Number(addressResult.rows[0].id),
    };
}
