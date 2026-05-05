import { useEffect, useState } from 'react';
import { fetchOrders } from '../lib/api';

type AccountPageProps = {
  userName: string;
};

export function AccountPage({ userName }: AccountPageProps) {
  const [orders, setOrders] = useState<Array<{ orderCode: string; total: number; status: string; createdAt: string; subscriptionFrequency?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders()
      .then((data) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="shell page-block">
      <section className="page-banner">
        <p>Account</p>
        <h2>Welcome, {userName}</h2>
      </section>
      <section className="product-section">
        <h3>Your Orders & Subscriptions</h3>
        {loading && <p className="state">Loading orders...</p>}
        {!loading && !orders.length && <p className="state">No orders yet.</p>}
        <div className="review-list">
          {orders.map((order) => (
            <p key={order.orderCode}>
              <strong>{order.orderCode}</strong> - ${order.total.toFixed(2)} - {order.status}
              {order.subscriptionFrequency ? ` - ${order.subscriptionFrequency}` : ''}
            </p>
          ))}
        </div>
      </section>
    </main>
  );
}
