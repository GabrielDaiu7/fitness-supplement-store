import { useEffect, useState } from 'react';
import {
  fetchAdminOrders,
  fetchAdminOverview,
  fetchAdminProducts,
  fetchAdminUsers,
  updateAdminOrderStatus,
  updateAdminProduct,
} from '../lib/api';

type AdminProduct = {
  id: number;
  name: string;
  category: string;
  price: number;
  inStock: boolean;
  featured: boolean;
};

export function AdminPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<
    Array<{
      id: number;
      orderCode: string;
      total: number;
      status: string;
      createdAt: string;
      subscriptionFrequency?: string;
      customerName: string;
      customerEmail: string;
    }>
  >([]);
  const [users, setUsers] = useState<Array<{ id: number; name: string; email: string; isAdmin: boolean; createdAt: string }>>([]);
  const [overview, setOverview] = useState<{
    totalSales: number;
    totalOrders: number;
    totalUsers: number;
    activeProducts: number;
    outOfStockProducts: number;
    activeSubscriptions: number;
  } | null>(null);
  const [activePanel, setActivePanel] = useState<'products' | 'orders' | 'users'>('products');
  const [loading, setLoading] = useState(true);

  async function load() {
    const [overviewData, productData, orderData, userData] = await Promise.all([
      fetchAdminOverview(),
      fetchAdminProducts(),
      fetchAdminOrders(),
      fetchAdminUsers(),
    ]);
    setOverview(overviewData);
    setProducts(productData);
    setOrders(orderData);
    setUsers(userData);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function patchProduct(id: number, payload: { price?: number; inStock?: boolean; featured?: boolean }) {
    await updateAdminProduct(id, payload);
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? {
              ...product,
              price: payload.price ?? product.price,
              inStock: payload.inStock ?? product.inStock,
              featured: payload.featured ?? product.featured,
            }
          : product
      )
    );
  }

  async function patchOrderStatus(orderId: number, status: string) {
    await updateAdminOrderStatus(orderId, status);
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));
  }

  return (
    <main className="shell page-block admin-dashboard">
      <section className="page-banner admin-banner">
        <p>Admin</p>
        <h2>Dashboard</h2>
        <span>Manage products, orders, subscriptions, and customers.</span>
      </section>
      {loading && <p className="state">Loading admin data...</p>}
      {!loading && overview && (
        <>
          <section className="admin-kpis">
            <article><p>Revenue</p><h4>${overview.totalSales.toFixed(2)}</h4></article>
            <article><p>Orders</p><h4>{overview.totalOrders}</h4></article>
            <article><p>Customers</p><h4>{overview.totalUsers}</h4></article>
            <article><p>Active Products</p><h4>{overview.activeProducts}</h4></article>
            <article><p>Out of Stock</p><h4>{overview.outOfStockProducts}</h4></article>
            <article><p>Subscriptions</p><h4>{overview.activeSubscriptions}</h4></article>
          </section>

          <section className="admin-tabs">
            <button className={activePanel === 'products' ? 'chip active' : 'chip'} onClick={() => setActivePanel('products')}>Products</button>
            <button className={activePanel === 'orders' ? 'chip active' : 'chip'} onClick={() => setActivePanel('orders')}>Orders</button>
            <button className={activePanel === 'users' ? 'chip active' : 'chip'} onClick={() => setActivePanel('users')}>Users</button>
          </section>

          {activePanel === 'products' && (
            <section className="admin-panel">
              <div className="admin-panel-head">
                <h3>Product Catalog</h3>
                <p>Update pricing, stock, and featured placements.</p>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Featured</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td>${Number(product.price).toFixed(2)}</td>
                        <td>{product.inStock ? 'In stock' : 'Out of stock'}</td>
                        <td>{product.featured ? 'Yes' : 'No'}</td>
                        <td>
                          <div className="actions">
                            <button className="btn btn-ghost" onClick={() => patchProduct(product.id, { inStock: !product.inStock })}>
                              {product.inStock ? 'Mark OOS' : 'Restock'}
                            </button>
                            <button className="btn btn-ghost" onClick={() => patchProduct(product.id, { featured: !product.featured })}>
                              {product.featured ? 'Unfeature' : 'Feature'}
                            </button>
                            <button className="btn btn-solid mini" onClick={() => patchProduct(product.id, { price: Number((Number(product.price) + 1).toFixed(2)) })}>
                              +$1
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activePanel === 'orders' && (
            <section className="admin-panel">
              <div className="admin-panel-head">
                <h3>Orders</h3>
                <p>Track processing and fulfillment status.</p>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Subscription</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.orderCode}</td>
                        <td>
                          <div className="admin-cell-stack">
                            <strong>{order.customerName}</strong>
                            <span>{order.customerEmail}</span>
                          </div>
                        </td>
                        <td>${order.total.toFixed(2)}</td>
                        <td>
                          <select
                            className="filter-input"
                            value={order.status}
                            onChange={(event) => patchOrderStatus(order.id, event.target.value)}
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td>{order.subscriptionFrequency ?? '-'}</td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activePanel === 'users' && (
            <section className="admin-panel">
              <div className="admin-panel-head">
                <h3>Customers</h3>
                <p>View account roles and registration timeline.</p>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.isAdmin ? 'Admin' : 'Customer'}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
