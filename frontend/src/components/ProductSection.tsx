import { useMemo, useState } from 'react';
import type { Product } from '../types';
import { getProductTypeLabel } from '../lib/productLabels';

type ProductSectionProps = {
  categories: string[];
  activeCategory: string;
  products: Product[];
  loading: boolean;
  error: string;
  onCategoryChange: (category: string) => void;
  onDetails: (product: Product) => void;
  onAdd: (product: Product) => void;
  wishlistProductIds: number[];
  onToggleWishlist: (product: Product) => void;
  formatPrice: (usdAmount: number) => string;
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
  wishlistProductIds,
  onToggleWishlist,
  formatPrice,
}: ProductSectionProps) {
  const [query, setQuery] = useState('');
  const [goal, setGoal] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  const availableGoals = useMemo(
    () => ['All', ...Array.from(new Set(products.flatMap((product) => product.goals ?? [])))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery) ||
        (product.goals ?? []).some((productGoal) => productGoal.toLowerCase().includes(normalizedQuery));

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
        {filteredProducts.map((product) => {
          const reviews = product.reviews ?? [];
          const averageRating = reviews.length
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;
          const productMeta = [product.brand, product.flavor, product.servings ? `${product.servings} servings` : null].filter(Boolean);
          const isLowStock =
            product.inStock !== false &&
            typeof product.stockQuantity === 'number' &&
            typeof product.lowStockThreshold === 'number' &&
            product.stockQuantity <= product.lowStockThreshold;

          return (
            <article key={product.id} className="product-card">
              <div className="product-image-wrap">
                <img className="product-image" src={product.image} alt={product.name} loading="lazy" />
                <span className={product.inStock === false ? 'stock-badge out' : 'stock-badge'}>
                  {product.inStock === false ? 'Out of stock' : isLowStock ? `Only ${product.stockQuantity} left` : 'In stock'}
                </span>
              </div>
              <div className="product-card-body">
                <div className="product-card-topline">
                  <p className="label">{getProductTypeLabel(product)}</p>
                  {reviews.length > 0 && <span className="product-rating">{averageRating.toFixed(1)} / 5 ({reviews.length})</span>}
                </div>
                <h3>{product.name}</h3>
                {productMeta.length > 0 && <p className="product-meta">{productMeta.join(' | ')}</p>}
                <p className="product-description">{product.description}</p>
              </div>
              <div className="product-foot">
                <span>{formatPrice(product.price)}</span>
                <div className="actions">
                  <button className="btn btn-ghost" onClick={() => onDetails(product)}>
                    Details
                  </button>
                  <button className="btn btn-ghost mini" onClick={() => onToggleWishlist(product)}>
                    {wishlistProductIds.includes(product.id) ? 'Saved' : 'Save'}
                  </button>
                  <button className="btn btn-solid mini" disabled={product.inStock === false} onClick={() => onAdd(product)}>
                    {product.inStock === false ? 'Out' : 'Add'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
