import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';

type SearchDrawerProps = {
  products: Product[];
  onClose: () => void;
  formatPrice: (usdAmount: number) => string;
};

export function SearchDrawer({ products, onClose, formatPrice }: SearchDrawerProps) {
  const [query, setQuery] = useState('');
  const featured = useMemo(() => products.slice(0, 4), [products]);
  const popularSearches = ['Best Sellers', 'Protein', 'Creatine', 'Hydration'];
  const filtered = useMemo(() => {
    if (!query.trim()) return featured;
    const normalizedQuery = query.trim().toLowerCase();
    return products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(normalizedQuery) ||
          product.description.toLowerCase().includes(normalizedQuery) ||
          product.category.toLowerCase().includes(normalizedQuery) ||
          (product.goals ?? []).some((goal) => goal.toLowerCase().includes(normalizedQuery))
      )
      .slice(0, 6);
  }, [featured, products, query]);

  return (
    <div className="overlay drawer-overlay" onClick={onClose}>
      <aside className="search-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-head">
          <input
            className="search-box"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for..."
          />
          <button className="btn btn-ghost" onClick={onClose}>X</button>
        </div>
        <p className="drawer-title">Popular Searches</p>
        <div className="drawer-links">
          {popularSearches.map((search) => (
            <button key={search} type="button" onClick={() => setQuery(search)}>
              {search}
            </button>
          ))}
        </div>
        <p className="drawer-title">{query.trim() ? 'Search Results' : 'Featured Products'}</p>
        <div className="drawer-product-grid">
          {filtered.map((product) => (
            <Link to={`/product/${product.id}`} key={product.id} className="drawer-product" onClick={onClose}>
              <img src={product.image} alt={product.name} loading="lazy" />
              <h6>{product.name}</h6>
              <span>{formatPrice(product.price)}</span>
            </Link>
          ))}
          {query.trim() && filtered.length === 0 && <p className="state">No products found.</p>}
        </div>
      </aside>
    </div>
  );
}
