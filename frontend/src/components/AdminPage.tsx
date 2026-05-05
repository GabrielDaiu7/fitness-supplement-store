import { useEffect, useState } from 'react';
import { fetchAdminProducts, updateAdminProduct } from '../lib/api';

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
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await fetchAdminProducts();
    setProducts(data);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function patchProduct(id: number, payload: { price?: number; inStock?: boolean; featured?: boolean }) {
    await updateAdminProduct(id, payload);
    await load();
  }

  return (
    <main className="shell page-block">
      <section className="page-banner">
        <p>Admin</p>
        <h2>Dashboard</h2>
      </section>
      {loading && <p className="state">Loading admin data...</p>}
      <div className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <h3>{product.name}</h3>
            <p>{product.category}</p>
            <p>${Number(product.price).toFixed(2)}</p>
            <div className="actions">
              <button className="btn btn-ghost" onClick={() => patchProduct(product.id, { inStock: !product.inStock })}>
                {product.inStock ? 'Mark OOS' : 'Mark In Stock'}
              </button>
              <button className="btn btn-ghost" onClick={() => patchProduct(product.id, { featured: !product.featured })}>
                {product.featured ? 'Unfeature' : 'Feature'}
              </button>
              <button className="btn btn-solid" onClick={() => patchProduct(product.id, { price: Number((Number(product.price) + 1).toFixed(2)) })}>
                +$1
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
