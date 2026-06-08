import nodemailer from 'nodemailer';
import { pool } from '../db/pool';
import { CheckoutItem } from '../types/auth';

type ShippingInput = { fullName: string; email: string; address: string; city: string; zip: string };

const bundleRules: Record<string, { productIds: number[]; discountPercent: number }> = {
  PERFORMANCE: { productIds: [2, 3, 6], discountPercent: 10 },
  WELLNESS: { productIds: [4, 5, 6], discountPercent: 10 },
  LEAN: { productIds: [3, 6, 10], discountPercent: 10 },
};

export class CheckoutValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckoutValidationError';
  }
}

export async function createCheckoutOrder(input: {
  userId: number;
  items: CheckoutItem[];
  promoCode: string;
  shipping: ShippingInput;
  subscribeFrequency?: string;
  shippingMethod: string;
  bundleCode?: string;
}) {
  const ids = Array.from(new Set(input.items.map((item) => item.id)));
  const result = await pool.query('SELECT id, price, in_stock, stock_quantity FROM products WHERE id = ANY($1::int[])', [ids]);
  if (result.rows.length !== ids.length) {
    throw new CheckoutValidationError('One or more products in your cart are no longer available.');
  }

  const unavailable = result.rows.find((row) => row.in_stock === false);
  if (unavailable) {
    throw new CheckoutValidationError('One or more products in your cart are out of stock.');
  }
  const quantityMap = new Map<number, number>(result.rows.map((row) => [Number(row.id), Number(row.stock_quantity)]));
  const insufficient = input.items.find((item) => Math.max(1, item.quantity) > (quantityMap.get(item.id) ?? 0));
  if (insufficient) {
    throw new CheckoutValidationError('One or more products do not have enough inventory for that quantity.');
  }

  const priceMap = new Map<number, number>(result.rows.map((row) => [Number(row.id), Number(row.price)]));

  const subtotal = input.items.reduce((sum, item) => {
    const price = priceMap.get(item.id);
    if (price === undefined) return sum;
    return sum + price * Math.max(1, item.quantity);
  }, 0);

  let discountRate = 0;
  if (input.promoCode) {
    const coupon = await pool.query(
      `SELECT discount_percent, min_subtotal
       FROM coupons
       WHERE code = $1
         AND active = true
         AND (expires_at IS NULL OR expires_at > now())`,
      [input.promoCode]
    );
    const foundCoupon = coupon.rows[0] as { discount_percent: string; min_subtotal: string } | undefined;
    if (!foundCoupon) {
      throw new CheckoutValidationError('Promo code is invalid or expired.');
    }
    if (subtotal < Number(foundCoupon.min_subtotal)) {
      throw new CheckoutValidationError(`Promo code requires a subtotal of at least $${Number(foundCoupon.min_subtotal).toFixed(2)}.`);
    }
    discountRate = Number(foundCoupon.discount_percent) / 100;
  }
  let bundleDiscount = 0;
  const bundleCode = input.bundleCode?.toUpperCase().trim();
  const bundleRule = bundleCode ? bundleRules[bundleCode] : undefined;
  if (bundleRule) {
    const cartIds = new Set(input.items.map((item) => item.id));
    const qualifies = bundleRule.productIds.every((productId) => cartIds.has(productId));
    if (qualifies) {
      const bundleSubtotal = input.items.reduce((sum, item) => {
        if (!bundleRule.productIds.includes(item.id)) return sum;
        const price = priceMap.get(item.id);
        if (price === undefined) return sum;
        return sum + price * Math.max(1, item.quantity);
      }, 0);
      bundleDiscount = bundleSubtotal * (bundleRule.discountPercent / 100);
    }
  }

  const discount = subtotal * discountRate + bundleDiscount;
  const discountedSubtotal = subtotal - discount;
  const shippingCost = input.shippingMethod === 'express' ? 12.5 : discountedSubtotal >= 70 ? 0 : 5.99;
  const tax = discountedSubtotal * 0.08;
  const total = discountedSubtotal + shippingCost + tax;
  const itemCount = input.items.reduce((sum, item) => sum + Math.max(1, item.quantity), 0);
  const orderCode = `FU-${Date.now()}`;

  const addressResult = await pool.query(
    `INSERT INTO addresses (user_id, full_name, email, address, city, zip, is_default)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     RETURNING id`,
    [input.userId, input.shipping.fullName, input.shipping.email, input.shipping.address, input.shipping.city, input.shipping.zip]
  );

  const orderResult = await pool.query(
    `INSERT INTO orders (user_id, order_code, subtotal, shipping, tax, discount, total, promo_code, subscription_frequency)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      input.userId,
      orderCode,
      Number(subtotal.toFixed(2)),
      Number(shippingCost.toFixed(2)),
      Number(tax.toFixed(2)),
      Number(discount.toFixed(2)),
      Number(total.toFixed(2)),
      input.promoCode || bundleCode || null,
      input.subscribeFrequency || null,
    ]
  );

  const orderId = Number(orderResult.rows[0].id);
  for (const item of input.items) {
    const unitPrice = priceMap.get(item.id);
    if (unitPrice === undefined) continue;
    await pool.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
       VALUES ($1, $2, $3, $4)`,
      [orderId, item.id, Math.max(1, item.quantity), unitPrice]
    );
    await pool.query(
      `UPDATE products
       SET stock_quantity = GREATEST(0, stock_quantity - $2),
           in_stock = (stock_quantity - $2) > 0
       WHERE id = $1`,
      [item.id, Math.max(1, item.quantity)]
    );
  }

  const transport = nodemailer.createTransport({ streamTransport: true, newline: 'unix', buffer: true });
  await transport.sendMail({
    from: 'no-reply@fusion.store',
    to: input.shipping.email,
    subject: `Fusion Order Confirmation ${orderCode}`,
    text: `Your order ${orderCode} has been confirmed. Total: $${total.toFixed(2)}`,
  });

  const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [input.userId]);
  const userEmail = userResult.rows[0]?.email as string | undefined;
  if (userEmail) {
    await pool.query(
      `INSERT INTO email_jobs (user_id, email, job_type, payload, run_at)
       VALUES ($1, $2, 'reorder_reminder', $3::jsonb, now() + interval '30 days')`,
      [input.userId, userEmail, JSON.stringify({ orderCode })]
    );
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
