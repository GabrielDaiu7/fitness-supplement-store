import express from 'express';
import jwt from 'jsonwebtoken';
import { JWT_ACCESS_SECRET } from '../config/auth';
import { isUserEmailVerified } from '../services/auth.service';
import { CheckoutValidationError, createCheckoutOrder } from '../services/checkout.service';
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
    const rawItems = (req.body?.items ?? []) as CheckoutItem[];
    const promoCode = String(req.body?.promoCode ?? '').toUpperCase().trim();
    const shippingInput = req.body?.shipping as
      | { fullName: string; email: string; address: string; city: string; zip: string }
      | undefined;
    const subscribeFrequency = req.body?.subscribeFrequency as string | undefined;
    const shippingMethod = String(req.body?.shippingMethod ?? 'standard');
    const bundleCode = String(req.body?.bundleCode ?? '').trim().toUpperCase();

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      res.status(400).json({ ok: false, message: 'Cart is empty.' });
      return;
    }
    if (
      rawItems.some(
        (item) =>
          !Number.isInteger(Number(item.id)) ||
          !Number.isInteger(Number(item.quantity)) ||
          Number(item.id) <= 0 ||
          Number(item.quantity) <= 0
      )
    ) {
      res.status(400).json({ ok: false, message: 'Cart contains invalid quantities.' });
      return;
    }
    const items = rawItems.map((item) => ({ id: Number(item.id), quantity: Number(item.quantity) }));
    if (!shippingInput) {
      res.status(400).json({ ok: false, message: 'Shipping address is required.' });
      return;
    }
    if (
      !shippingInput.fullName?.trim() ||
      !shippingInput.email?.trim() ||
      !shippingInput.address?.trim() ||
      !shippingInput.city?.trim() ||
      !shippingInput.zip?.trim()
    ) {
      res.status(400).json({ ok: false, message: 'Complete shipping details are required.' });
      return;
    }
    if (!['standard', 'express'].includes(shippingMethod)) {
      res.status(400).json({ ok: false, message: 'Invalid shipping method.' });
      return;
    }

    const result = await createCheckoutOrder({
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
  } catch (error) {
    if (error instanceof CheckoutValidationError) {
      res.status(400).json({ ok: false, message: error.message });
      return;
    }
    res.status(500).json({ ok: false, message: 'Checkout failed.' });
  }
}
