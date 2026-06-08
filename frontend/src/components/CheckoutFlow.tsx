import { useMemo, useState } from 'react';
import type { CartItem } from '../types';

type CheckoutFlowProps = {
  items: CartItem[];
  total: number;
  submitting: boolean;
  formatPrice: (usdAmount: number) => string;
  onClose: () => void;
  onPlaceOrder: (payload: {
    shipping: { fullName: string; email: string; address: string; city: string; zip: string };
    promoCode: string;
    shippingMethod: 'standard' | 'express';
    subscribeFrequency?: string;
  }) => Promise<void>;
};

export function CheckoutFlow({ items, total, submitting, onClose, onPlaceOrder, formatPrice }: CheckoutFlowProps) {
  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState({ fullName: '', email: '', address: '', city: '', zip: '' });
  const [promoCode, setPromoCode] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [subscribeFrequency, setSubscribeFrequency] = useState('');

  const canContinueShipping = useMemo(
    () => Object.values(shipping).every((value) => value.trim().length > 0),
    [shipping]
  );

  return (
    <div className="overlay" onClick={onClose}>
      <section className="checkout" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-head">
          <h3>Checkout</h3>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>

        <div className="checkout-steps">
          <span className={step >= 1 ? 'on' : ''}>1 Shipping</span>
          <span className={step >= 2 ? 'on' : ''}>2 Review</span>
        </div>

        <div className="checkout-layout">
          <div className="checkout-body">
            {step === 1 && (
              <>
                <h4 className="checkout-title">Shipping Details</h4>
                <label className="checkout-label">Full name</label>
                <input className="checkout-input" placeholder="Jane Doe" value={shipping.fullName} onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} />
                <label className="checkout-label">Email</label>
                <input className="checkout-input" placeholder="jane@email.com" value={shipping.email} onChange={(e) => setShipping({ ...shipping, email: e.target.value })} />
                <label className="checkout-label">Address</label>
                <input className="checkout-input" placeholder="123 Main Street" value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} />
                <div className="inline-fields">
                  <div>
                    <label className="checkout-label">City</label>
                    <input className="checkout-input" placeholder="Los Angeles" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} />
                  </div>
                  <div>
                    <label className="checkout-label">ZIP</label>
                    <input className="checkout-input" placeholder="90001" value={shipping.zip} onChange={(e) => setShipping({ ...shipping, zip: e.target.value })} />
                  </div>
                </div>
                <div className="inline-fields">
                  <div>
                    <label className="checkout-label">Promo code</label>
                    <input className="checkout-input" placeholder="FUSION10" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                  </div>
                  <div>
                    <label className="checkout-label">Shipping method</label>
                    <select className="checkout-input" value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value as 'standard' | 'express')}>
                      <option value="standard">Standard Shipping</option>
                      <option value="express">Express Shipping</option>
                    </select>
                  </div>
                </div>
                <label className="checkout-label">Delivery plan</label>
                <select className="checkout-input" value={subscribeFrequency} onChange={(e) => setSubscribeFrequency(e.target.value)}>
                  <option value="">One-time purchase</option>
                  <option value="2-weeks">Subscribe every 2 weeks</option>
                  <option value="4-weeks">Subscribe every 4 weeks</option>
                  <option value="8-weeks">Subscribe every 8 weeks</option>
                </select>
                <button className="btn btn-solid checkout-primary" disabled={!canContinueShipping} onClick={() => setStep(2)}>Review Order</button>
              </>
            )}

            {step === 2 && (
              <>
                <h4 className="checkout-title">Review & Place Order</h4>
                <p className="state">Payment collection is not connected yet. This order will be recorded for follow-up fulfillment.</p>
                <div className="review-list">
                  {items.map((item) => (
                    <p key={item.id}>{item.name} x {item.quantity}</p>
                  ))}
                </div>
                <p className="review-total">Total: {formatPrice(total)}</p>
                <div className="checkout-actions">
                  <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
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
              </>
            )}
          </div>

          <aside className="checkout-summary">
            <h4>Order Summary</h4>
            <div className="checkout-summary-list">
              {items.map((item) => (
                <div key={item.id} className="checkout-summary-row">
                  <span>{item.name}</span>
                  <span>x{item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="checkout-summary-total">
              <span>Total</span>
              <strong>{formatPrice(total)}</strong>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
