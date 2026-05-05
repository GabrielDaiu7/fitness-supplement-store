import { useMemo, useState } from 'react';
import type { CartItem } from '../types';

type CheckoutFlowProps = {
  items: CartItem[];
  total: number;
  submitting: boolean;
  onClose: () => void;
  onPlaceOrder: (payload: {
    shipping: { fullName: string; email: string; address: string; city: string; zip: string };
    promoCode: string;
    shippingMethod: 'standard' | 'express';
    subscribeFrequency?: string;
  }) => Promise<void>;
};

export function CheckoutFlow({ items, total, submitting, onClose, onPlaceOrder }: CheckoutFlowProps) {
  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState({ fullName: '', email: '', address: '', city: '', zip: '' });
  const [payment, setPayment] = useState({ cardName: '', cardNumber: '', expiry: '', cvc: '' });
  const [promoCode, setPromoCode] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [subscribeFrequency, setSubscribeFrequency] = useState('');

  const canContinueShipping = useMemo(
    () => Object.values(shipping).every((value) => value.trim().length > 0),
    [shipping]
  );

  const canContinuePayment = useMemo(
    () => Object.values(payment).every((value) => value.trim().length > 0),
    [payment]
  );

  return (
    <div className="overlay" onClick={onClose}>
      <section className="checkout" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-head">
          <h3>Checkout</h3>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>

        <div className="checkout-steps">
          <span className={step >= 1 ? 'on' : ''}>1. Shipping</span>
          <span className={step >= 2 ? 'on' : ''}>2. Payment</span>
          <span className={step >= 3 ? 'on' : ''}>3. Review</span>
        </div>

        {step === 1 && (
          <div className="checkout-body">
            <input placeholder="Full name" value={shipping.fullName} onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} />
            <input placeholder="Email" value={shipping.email} onChange={(e) => setShipping({ ...shipping, email: e.target.value })} />
            <input placeholder="Address" value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} />
            <div className="inline-fields">
              <input placeholder="City" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} />
              <input placeholder="ZIP" value={shipping.zip} onChange={(e) => setShipping({ ...shipping, zip: e.target.value })} />
            </div>
            <div className="inline-fields">
              <input placeholder="Promo code (ex: FUSION10)" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
              <select value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value as 'standard' | 'express')}>
                <option value="standard">Standard Shipping</option>
                <option value="express">Express Shipping</option>
              </select>
            </div>
            <select value={subscribeFrequency} onChange={(e) => setSubscribeFrequency(e.target.value)}>
              <option value="">One-time purchase</option>
              <option value="2-weeks">Subscribe every 2 weeks</option>
              <option value="4-weeks">Subscribe every 4 weeks</option>
              <option value="8-weeks">Subscribe every 8 weeks</option>
            </select>
            <button className="btn btn-solid" disabled={!canContinueShipping} onClick={() => setStep(2)}>Continue</button>
          </div>
        )}

        {step === 2 && (
          <div className="checkout-body">
            <input placeholder="Name on card" value={payment.cardName} onChange={(e) => setPayment({ ...payment, cardName: e.target.value })} />
            <input placeholder="Card number" value={payment.cardNumber} onChange={(e) => setPayment({ ...payment, cardNumber: e.target.value })} />
            <div className="inline-fields">
              <input placeholder="MM/YY" value={payment.expiry} onChange={(e) => setPayment({ ...payment, expiry: e.target.value })} />
              <input placeholder="CVC" value={payment.cvc} onChange={(e) => setPayment({ ...payment, cvc: e.target.value })} />
            </div>
            <div className="checkout-actions">
              <button className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-solid" disabled={!canContinuePayment} onClick={() => setStep(3)}>Review</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="checkout-body">
            <div className="review-list">
              {items.map((item) => (
                <p key={item.id}>{item.name} x {item.quantity}</p>
              ))}
            </div>
            <p className="review-total">Total: ${total.toFixed(2)}</p>
            <div className="checkout-actions">
              <button className="btn btn-outline" onClick={() => setStep(2)}>Back</button>
              <button
                className="btn btn-solid"
                disabled={submitting}
                onClick={() =>
                  onPlaceOrder({
                    shipping,
                    promoCode,
                    shippingMethod,
                    subscribeFrequency: subscribeFrequency || undefined,
                  })
                }
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
