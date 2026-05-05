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

      {loading && <p className="state">Loading products...</p>}
      {!loading && error && <p className="state warn">{error}</p>}

      <div className="product-grid">
        {products.map((product) => (
          <article key={product.id} className="product-card">
            <img className="product-image" src={product.image || '/images/default-product.svg'} alt={product.name} />
            <p className="label">{product.category}</p>
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
