import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';

type SearchDrawerProps = {
  products: Product[];
  onClose: () => void;
};

export function SearchDrawer({ products, onClose }: SearchDrawerProps) {
  const [query, setQuery] = useState('');
  const featured = useMemo(() => products.slice(0, 4), [products]);
  const filtered = useMemo(() => {
    if (!query.trim()) return featured;
    return products
      .filter((product) => product.name.toLowerCase().includes(query.toLowerCase()))
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
          <p>Best Sellers</p>
          <p>New Launches</p>
          <p>Stacks</p>
        </div>
        <p className="drawer-title">Featured Products</p>
        <div className="drawer-product-grid">
          {filtered.map((product) => (
            <Link to={`/product/${product.id}`} key={product.id} className="drawer-product" onClick={onClose}>
              <img src={product.image} alt={product.name} loading="lazy" />
              <h6>{product.name}</h6>
              <span>${product.price.toFixed(2)}</span>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
