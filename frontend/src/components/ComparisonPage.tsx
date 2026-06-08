import type { Product } from '../types';

type ComparisonPageProps = {
  products: Product[];
  formatPrice: (usdAmount: number) => string;
};

const targetCategories = ['Protein', 'Creatine', 'Pre-Workout', 'Hydration'];

export function ComparisonPage({ products, formatPrice }: ComparisonPageProps) {
  const comparisonProducts = targetCategories
    .map((category) => products.find((product) => product.category === category))
    .filter((product): product is Product => Boolean(product));

  return (
    <main className="shell page-block">
      <section className="page-banner">
        <p>Compare</p>
        <h2>Supplement Comparison</h2>
      </section>

      <section className="account-panel comparison-panel">
        <div className="admin-table-wrap">
          <table className="admin-table comparison-table">
            <thead>
              <tr>
                <th>Type</th>
                {comparisonProducts.map((product) => <th key={product.id}>{product.category}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Product</td>
                {comparisonProducts.map((product) => <td key={product.id}>{product.name}</td>)}
              </tr>
              <tr>
                <td>Best For</td>
                {comparisonProducts.map((product) => <td key={product.id}>{(product.goals ?? []).join(', ') || 'Daily support'}</td>)}
              </tr>
              <tr>
                <td>Serving</td>
                {comparisonProducts.map((product) => <td key={product.id}>{product.supplementFacts?.servingSize ?? '1 serving'}</td>)}
              </tr>
              <tr>
                <td>Highlights</td>
                {comparisonProducts.map((product) => <td key={product.id}>{(product.supplementFacts?.highlights ?? product.ingredients ?? []).slice(0, 3).join(', ')}</td>)}
              </tr>
              <tr>
                <td>Stimulant</td>
                {comparisonProducts.map((product) => <td key={product.id}>{product.category === 'Pre-Workout' ? 'Contains caffeine' : 'Stimulant-free'}</td>)}
              </tr>
              <tr>
                <td>Price</td>
                {comparisonProducts.map((product) => <td key={product.id}>{formatPrice(product.price)}</td>)}
              </tr>
              <tr>
                <td>Stock</td>
                {comparisonProducts.map((product) => (
                  <td key={product.id}>
                    {product.inStock === false
                      ? 'Out of stock'
                      : typeof product.stockQuantity === 'number'
                        ? `${product.stockQuantity} available`
                        : 'Available'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
