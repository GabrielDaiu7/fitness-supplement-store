import type { CartItem } from '../types';

type CartDrawerProps = {
  items: CartItem[];
  total: number;
  bundleCode?: string;
  onClose: () => void;
  onStartCheckout: () => void;
  onUpdateQty: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
  formatPrice: (usdAmount: number) => string;
};

export function CartDrawer({
  items,
  total,
  bundleCode,
  onClose,
  onStartCheckout,
  onUpdateQty,
  onRemove,
  formatPrice,
}: CartDrawerProps) {
  return (
    <div className="overlay" onClick={onClose}>
      <aside className="cart" onClick={(e) => e.stopPropagation()}>
        <div className="cart-head">
          <h3>Your Cart</h3>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>

        {!items.length && <p className="state">Your cart is empty.</p>}

        <div className="cart-list">
          {items.map((item) => (
            <article key={item.id} className="cart-row">
              <div>
                <strong>{item.name}</strong>
                <p>{formatPrice(item.price)} x {item.quantity}</p>
              </div>
              <div className="qty">
                <button className="btn btn-ghost" onClick={() => onUpdateQty(item.id, -1)}>-</button>
                <span>{item.quantity}</span>
                <button className="btn btn-ghost" onClick={() => onUpdateQty(item.id, 1)}>+</button>
                <button className="btn btn-ghost danger" onClick={() => onRemove(item.id)}>x</button>
              </div>
            </article>
          ))}
        </div>

        <div className="cart-foot">
          {bundleCode && <p className="state">Stack discount attached: {bundleCode}. Final discount is applied at checkout.</p>}
          <p>Total: {formatPrice(total)}</p>
          <button className="btn btn-solid" disabled={!items.length} onClick={onStartCheckout}>
            Continue to Checkout
          </button>
        </div>
      </aside>
    </div>
  );
}
