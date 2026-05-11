import { useEffect, useState, type FormEvent } from 'react';
import {
  createAdminProduct,
  fetchAdminFunnel,
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
  description?: string;
  image?: string;
  price: number;
  inStock: boolean;
  featured: boolean;
};

type AdminPageProps = {
  formatPrice: (usdAmount: number) => string;
};

export function AdminPage({ formatPrice }: AdminPageProps) {
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
  const [funnel, setFunnel] = useState<{
    registerStarted: number;
    registerCompleted: number;
    verifyCompleted: number;
    firstOrderUsers: number;
    couponOrders: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    image: '',
    inStock: true,
    featured: false,
  });

  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    name: '',
    category: '',
    description: '',
    image: '',
    price: '',
    inStock: true,
    featured: false,
  });

  async function load() {
    const [overviewData, productData, orderData, userData, funnelData] = await Promise.all([
      fetchAdminOverview(),
      fetchAdminProducts(),
      fetchAdminOrders(),
      fetchAdminUsers(),
      fetchAdminFunnel(),
    ]);
    setOverview(overviewData);
    setProducts(productData);
    setOrders(orderData);
    setUsers(userData);
    setFunnel(funnelData);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function patchProduct(
    id: number,
    payload: { name?: string; category?: string; description?: string; image?: string; price?: number; inStock?: boolean; featured?: boolean }
  ) {
    await updateAdminProduct(id, payload);
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? {
              ...product,
              name: payload.name ?? product.name,
              category: payload.category ?? product.category,
              description: payload.description ?? product.description,
              image: payload.image ?? product.image,
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

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const price = Number(createForm.price);
    if (!createForm.name.trim() || !createForm.category.trim() || !Number.isFinite(price)) return;

    setCreating(true);
    try {
      const product = await createAdminProduct({
        name: createForm.name.trim(),
        category: createForm.category.trim(),
        price,
        description: createForm.description.trim(),
        image: createForm.image.trim(),
        inStock: createForm.inStock,
        featured: createForm.featured,
      });
      setProducts((prev) => [...prev, product].sort((a, b) => a.id - b.id));
      setCreateForm({
        name: '',
        category: '',
        price: '',
        description: '',
        image: '',
        inStock: true,
        featured: false,
      });
      setShowCreateForm(false);
    } finally {
      setCreating(false);
    }
  }

  function openUpdateForm(product: AdminProduct) {
    setEditingProduct(product);
    setUpdateForm({
      name: product.name,
      category: product.category,
      description: product.description ?? '',
      image: product.image ?? '',
      price: String(product.price),
      inStock: product.inStock,
      featured: product.featured,
    });
  }

  async function handleUpdateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProduct) return;

    const price = Number(updateForm.price);
    if (!Number.isFinite(price)) return;

    setUpdating(true);
    try {
      await patchProduct(editingProduct.id, {
        name: updateForm.name.trim(),
        category: updateForm.category.trim(),
        description: updateForm.description.trim(),
        image: updateForm.image.trim(),
        price,
        inStock: updateForm.inStock,
        featured: updateForm.featured,
      });
      setEditingProduct(null);
    } finally {
      setUpdating(false);
    }
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
            <article><p>Revenue</p><h4>{formatPrice(overview.totalSales)}</h4></article>
            <article><p>Orders</p><h4>{overview.totalOrders}</h4></article>
            <article><p>Customers</p><h4>{overview.totalUsers}</h4></article>
            <article><p>Active Products</p><h4>{overview.activeProducts}</h4></article>
            <article><p>Out of Stock</p><h4>{overview.outOfStockProducts}</h4></article>
            <article><p>Subscriptions</p><h4>{overview.activeSubscriptions}</h4></article>
          </section>
          {funnel && (
            <section className="admin-kpis">
              <article><p>Reg Started</p><h4>{funnel.registerStarted}</h4></article>
              <article><p>Reg Completed</p><h4>{funnel.registerCompleted}</h4></article>
              <article><p>Verified</p><h4>{funnel.verifyCompleted}</h4></article>
              <article><p>First Orders</p><h4>{funnel.firstOrderUsers}</h4></article>
              <article><p>Coupon Orders</p><h4>{funnel.couponOrders}</h4></article>
            </section>
          )}

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
                <div className="actions" style={{ marginTop: '0.6rem' }}>
                  <button className="btn btn-solid" onClick={() => setShowCreateForm(true)}>
                    Create Product
                  </button>
                </div>
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
                        <td>{formatPrice(Number(product.price))}</td>
                        <td>{product.inStock ? 'In stock' : 'Out of stock'}</td>
                        <td>{product.featured ? 'Yes' : 'No'}</td>
                        <td>
                          <div className="actions">
                            <button className="btn btn-ghost" onClick={() => openUpdateForm(product)}>
                              Update
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
                        <td>{formatPrice(order.total)}</td>
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

      {showCreateForm && (
        <div className="overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal login-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>Create Product</h3>
              <button className="btn btn-ghost" onClick={() => setShowCreateForm(false)}>Close</button>
            </div>
            <form className="login-form" onSubmit={handleCreateProduct}>
              <label>
                Product Name
                <input value={createForm.name} onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))} required />
              </label>
              <label>
                Category
                <input value={createForm.category} onChange={(event) => setCreateForm((prev) => ({ ...prev, category: event.target.value }))} required />
              </label>
              <label>
                Price
                <input type="number" min="0" step="0.01" value={createForm.price} onChange={(event) => setCreateForm((prev) => ({ ...prev, price: event.target.value }))} required />
              </label>
              <label>
                Description
                <input value={createForm.description} onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))} />
              </label>
              <label>
                Image URL
                <input value={createForm.image} onChange={(event) => setCreateForm((prev) => ({ ...prev, image: event.target.value }))} />
              </label>
              <div className="actions">
                <label><input type="checkbox" checked={createForm.inStock} onChange={(event) => setCreateForm((prev) => ({ ...prev, inStock: event.target.checked }))} /> In Stock</label>
                <label><input type="checkbox" checked={createForm.featured} onChange={(event) => setCreateForm((prev) => ({ ...prev, featured: event.target.checked }))} /> Featured</label>
              </div>
              <button className="btn btn-solid" type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="overlay" onClick={() => setEditingProduct(null)}>
          <div className="modal login-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>Update Product</h3>
              <button className="btn btn-ghost" onClick={() => setEditingProduct(null)}>Close</button>
            </div>
            <form className="login-form" onSubmit={handleUpdateProduct}>
              <label>
                Product Name
                <input value={updateForm.name} onChange={(event) => setUpdateForm((prev) => ({ ...prev, name: event.target.value }))} required />
              </label>
              <label>
                Category
                <input value={updateForm.category} onChange={(event) => setUpdateForm((prev) => ({ ...prev, category: event.target.value }))} required />
              </label>
              <label>
                Description
                <input value={updateForm.description} onChange={(event) => setUpdateForm((prev) => ({ ...prev, description: event.target.value }))} />
              </label>
              <label>
                Image URL
                <input value={updateForm.image} onChange={(event) => setUpdateForm((prev) => ({ ...prev, image: event.target.value }))} />
              </label>
              <label>
                Price
                <input type="number" min="0" step="0.01" value={updateForm.price} onChange={(event) => setUpdateForm((prev) => ({ ...prev, price: event.target.value }))} required />
              </label>
              <div className="actions">
                <label><input type="checkbox" checked={updateForm.inStock} onChange={(event) => setUpdateForm((prev) => ({ ...prev, inStock: event.target.checked }))} /> In Stock</label>
                <label><input type="checkbox" checked={updateForm.featured} onChange={(event) => setUpdateForm((prev) => ({ ...prev, featured: event.target.checked }))} /> Featured</label>
              </div>
              <button className="btn btn-solid" type="submit" disabled={updating}>
                {updating ? 'Updating...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
