import express from 'express';
import jwt from 'jsonwebtoken';
import { JWT_ACCESS_SECRET } from '../config/auth';
import { isUserEmailVerified } from '../services/auth.service';
import { createCheckoutOrder } from '../services/checkout.service';
import { AuthPayload, CheckoutItem } from '../types/auth';

export async function checkoutController(req: express.Request, res: express.Response) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) {
    res.status(401).json({ ok: false, message: 'Please login before checkout.' });
    return;
  }

  try {
    const user = jwt.verify(token, JWT_ACCESS_SECRET) as AuthPayload;
    const emailVerified = await isUserEmailVerified(user.id);
    if (!emailVerified) {
      res.status(403).json({ ok: false, message: 'Please verify your email before checkout.' });
      return;
    }
    const items = (req.body?.items ?? []) as CheckoutItem[];
    const promoCode = String(req.body?.promoCode ?? '').toUpperCase().trim();
    const shippingInput = req.body?.shipping as
      | { fullName: string; email: string; address: string; city: string; zip: string }
      | undefined;
    const subscribeFrequency = req.body?.subscribeFrequency as string | undefined;
    const shippingMethod = String(req.body?.shippingMethod ?? 'standard');

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ ok: false, message: 'Cart is empty.' });
      return;
    }
    if (!shippingInput) {
      res.status(400).json({ ok: false, message: 'Shipping address is required.' });
      return;
    }

    const result = await createCheckoutOrder({
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
  } catch {
    res.status(500).json({ ok: false, message: 'Checkout failed.' });
  }
}
