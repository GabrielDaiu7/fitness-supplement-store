import { useMemo, useState } from 'react';
import type { Product } from '../types';

type ProductSectionProps = {
  categories: string[];
  activeCategory: string;
  products: Product[];
  loading: boolean;
  error: string;
  onCategoryChange: (category: string) => void;
  onDetails: (product: Product) => void;
  onAdd: (product: Product) => void;
};

export function ProductSection({
  categories,
  activeCategory,
  products,
  loading,
  error,
  onCategoryChange,
  onDetails,
  onAdd,
}: ProductSectionProps) {
  const [query, setQuery] = useState('');
  const [goal, setGoal] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  const availableGoals = useMemo(
    () => ['All', 'muscle', 'fat-loss', 'recovery'],
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery =
        query.trim().length === 0 ||
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase());

      const matchesGoal = goal === 'All' || Boolean(product.goals?.includes(goal));
      const matchesMin = minPrice.trim().length === 0 || product.price >= Number(minPrice);
      const matchesMax = maxPrice.trim().length === 0 || product.price <= Number(maxPrice);
      const matchesStock = !inStockOnly || product.inStock !== false;

      return matchesQuery && matchesGoal && matchesMin && matchesMax && matchesStock;
    });
  }, [goal, maxPrice, minPrice, products, query, inStockOnly]);

  return (
    <section className="product-section">
      <div className="section-head">
        <h2>Featured Products</h2>
        <div className="chips">
          {categories.map((category) => (
            <button
              key={category}
              className={category === activeCategory ? 'chip active' : 'chip'}
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <div className="catalog-filters">
        <input
          className="filter-input search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products..."
          aria-label="Search products"
        />
        <select
          className="filter-input"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          aria-label="Filter by goal"
        >
          {availableGoals.map((availableGoal) => (
            <option key={availableGoal} value={availableGoal}>
              {availableGoal}
            </option>
          ))}
        </select>
        <input
          className="filter-input"
          type="number"
          min={0}
          value={minPrice}
          onChange={(event) => setMinPrice(event.target.value)}
          placeholder="Min price"
          aria-label="Minimum price"
        />
        <input
          className="filter-input"
          type="number"
          min={0}
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
          placeholder="Max price"
          aria-label="Maximum price"
        />
        <button
          className="btn btn-ghost"
          onClick={() => {
            setQuery('');
            setGoal('All');
            setMinPrice('');
            setMaxPrice('');
            setInStockOnly(false);
          }}
        >
          Reset
        </button>
        <label className="stock-check">
          <input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} />
          In stock only
        </label>
      </div>

      {loading && <p className="state">Loading products...</p>}
      {!loading && error && <p className="state warn">{error}</p>}
      {!loading && !error && filteredProducts.length === 0 && (
        <p className="state">No products match your filters.</p>
      )}

      <div className="product-grid">
        {filteredProducts.map((product) => (
          <article key={product.id} className="product-card">
            <img className="product-image" src={product.image || '/images/default-product.svg'} alt={product.name} />
            <p className="label">{product.category}</p>
            {product.inStock === false && <p className="stock-badge">Out of stock</p>}
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <div className="product-foot">
              <span>${product.price.toFixed(2)}</span>
              <div className="actions">
                <button className="btn btn-ghost" onClick={() => onDetails(product)}>
                  Details
                </button>
                <button className="btn btn-solid mini" onClick={() => onAdd(product)}>
                  Add
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
