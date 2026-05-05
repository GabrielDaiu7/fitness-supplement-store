import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { AccountPage } from './components/AccountPage';
import { AdminPage } from './components/AdminPage';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutFlow } from './components/CheckoutFlow';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { ProductSection } from './components/ProductSection';
import { fallbackProducts } from './data/storefront';
import { fetchCategories, fetchProducts, getMe, login, logout, register, submitAdvancedCheckout } from './lib/api';
import type { CartItem, Product, User } from './types';

function toCategorySlug(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function CategoryPage({
  categories,
  products,
  loading,
  error,
  onDetails,
  onAdd,
}: {
  categories: string[];
  products: Product[];
  loading: boolean;
  error: string;
  onDetails: (product: Product) => void;
  onAdd: (product: Product) => void;
}) {
  const { categorySlug } = useParams();
  const selectedCategory = categories.find((category) => toCategorySlug(category) === categorySlug);

  if (!selectedCategory) {
    return <Navigate to="/" replace />;
  }

  const filteredProducts = products.filter((product) => product.category === selectedCategory);

  return (
    <main className="shell page-block">
      <section className="page-banner">
        <p>Category</p>
        <h2>{selectedCategory}</h2>
      </section>
      <ProductSection
        categories={categories}
        activeCategory={selectedCategory}
        products={filteredProducts}
        loading={loading}
        error={error}
        onCategoryChange={() => {}}
        onDetails={onDetails}
        onAdd={onAdd}
      />
    </main>
  );
}

function ProductDetailPage({
  products,
  onAdd,
}: {
  products: Product[];
  onAdd: (product: Product) => void;
}) {
  const navigate = useNavigate();
  const { productId } = useParams();
  const product = products.find((entry) => entry.id === Number(productId));

  if (!product) return <Navigate to="/" replace />;

  const relatedProducts = products
    .filter((entry) => entry.category === product.category && entry.id !== product.id)
    .slice(0, 3);

  const ingredients = product.ingredients ?? ['Active Performance Blend', 'Electrolyte Matrix', 'Digestive Enzyme Support'];
  const faqs =
    product.faqs ??
    [
      { q: 'When should I take this?', a: 'Use 20-30 minutes before training or as part of your daily routine.' },
      { q: 'Is it third-party tested?', a: 'Yes, each batch is tested for purity and label accuracy.' },
      { q: 'Can I stack this with other products?', a: 'Yes, this product is designed to pair with protein and recovery formulas.' },
    ];
  const reviews =
    product.reviews?.map((review) => ({ name: review.name, score: review.rating, body: review.text })) ??
    [
      { name: 'Alex M.', score: 5, body: 'Noticeable boost in training output and better recovery by week two.' },
      { name: 'Sam R.', score: 5, body: 'Tastes great and mixes fast. Solid daily staple.' },
      { name: 'Jordan T.', score: 4, body: 'Clean formula and no crash. Works exactly as expected.' },
    ];

  return (
    <main className="shell page-block">
      <section className="pdp-layout">
        <img className="pdp-image" src={product.image || '/images/default-product.svg'} alt={product.name} />
        <article className="pdp-main">
          <p className="label">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="pdp-description">{product.description}</p>
          <p className="pdp-price">${product.price.toFixed(2)}</p>
          <div className="pdp-certs">
            {(product.certifications ?? ['Lab Tested', 'GMP']).map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
          <div className="pdp-actions">
            <button className="btn btn-solid" onClick={() => onAdd(product)}>Add to Cart</button>
            <button className="btn btn-ghost" onClick={() => navigate(-1)}>Back</button>
          </div>
        </article>
      </section>

      <section className="pdp-grid">
        <article className="pdp-card">
          <h3>Ingredients</h3>
          {ingredients.map((item) => <p key={item}>{item}</p>)}
        </article>
        <article className="pdp-card">
          <h3>Usage</h3>
          <p>Mix one scoop with 300-400ml of cold water.</p>
          <p>Use daily for best performance and recovery results.</p>
        </article>
      </section>

      <section className="pdp-card">
        <h3>FAQs</h3>
        {faqs.map((faq) => (
          <article key={faq.q} className="faq-row">
            <strong>{faq.q}</strong>
            <p>{faq.a}</p>
          </article>
        ))}
      </section>

      <section className="pdp-card">
        <h3>Reviews</h3>
        {reviews.map((review) => (
          <article key={review.name} className="review-row">
            <p>{'*'.repeat(review.score)} by {review.name}</p>
            <span>{review.body}</span>
          </article>
        ))}
      </section>

      {relatedProducts.length > 0 && (
        <section className="pdp-card">
          <h3>Related Products</h3>
          <div className="product-grid">
            {relatedProducts.map((related) => (
              <article key={related.id} className="product-card">
                <img className="product-image" src={related.image || '/images/default-product.svg'} alt={related.name} />
                <p className="label">{related.category}</p>
                <h3>{related.name}</h3>
                <p>{related.description}</p>
                <div className="product-foot">
                  <span>${related.price.toFixed(2)}</span>
                  <div className="actions">
                    <button className="btn btn-ghost" onClick={() => navigate(`/product/${related.id}`)}>View</button>
                    <button className="btn btn-solid mini" onClick={() => onAdd(related)}>Add</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutState, setCheckoutState] = useState<'idle' | 'submitting'>('idle');
  const [loginOpen, setLoginOpen] = useState(false);
  const [account, setAccount] = useState<User | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart_items');
    if (savedCart) setCartItems(JSON.parse(savedCart) as CartItem[]);
    getMe().then((user) => setAccount(user));
  }, []);

  useEffect(() => {
    async function loadStore() {
      try {
        const [productData, categoryData] = await Promise.all([fetchProducts(), fetchCategories()]);
        const finalProducts = productData.length ? productData : fallbackProducts;
        setProducts(finalProducts);
        setCategories(['All', ...categoryData]);
      } catch {
        setProducts(fallbackProducts);
        setCategories(['All', ...new Set(fallbackProducts.map((p) => p.category))]);
        setError('Backend is offline. Showing demo catalog until API is connected.');
      } finally {
        setLoading(false);
      }
    }
    loadStore();
  }, []);

  useEffect(() => {
    localStorage.setItem('cart_items', JSON.stringify(cartItems));
  }, [cartItems]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const bestSellers = useMemo(() => products.slice(0, 4), [products]);
  const categoryTargets = useMemo(() => categories.filter((category) => category !== 'All'), [categories]);

  function addToCart(product: Product) {
    setCartItems((prev) => {
      const found = prev.find((item) => item.id === product.id);
      if (found) {
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function updateQuantity(productId: number, delta: number) {
    setCartItems((prev) =>
      prev
        .map((item) => (item.id === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(productId: number) {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  }

  async function handleCheckout(payload: {
    shipping: { fullName: string; email: string; address: string; city: string; zip: string };
    promoCode: string;
    shippingMethod: 'standard' | 'express';
    subscribeFrequency?: string;
  }) {
    if (!cartItems.length || checkoutState === 'submitting') return;
    try {
      setCheckoutState('submitting');
      await submitAdvancedCheckout({
        items: cartItems.map((item) => ({ id: item.id, quantity: item.quantity })),
        promoCode: payload.promoCode,
        shippingMethod: payload.shippingMethod,
        subscribeFrequency: payload.subscribeFrequency,
        shipping: payload.shipping,
      });
      setCartItems([]);
      setCheckoutOpen(false);
      setCartOpen(false);
    } catch {
      setError('Checkout failed. Please login and verify details.');
    } finally {
      setCheckoutState('idle');
    }
  }

  function handleAccountClick() {
    if (account) {
      setAccountMenuOpen((prev) => !prev);
      return;
    }
    setLoginOpen(true);
  }

  async function handleLogin(email: string, password: string): Promise<string | null> {
    try {
      const user = await login(email, password);
      setError('');
      setAccount(user);
      setAccountMenuOpen(false);
      setLoginOpen(false);
      return null;
    } catch {
      return 'Invalid email or password.';
    }
  }

  async function handleRegister(name: string, email: string, password: string): Promise<string | null> {
    try {
      const user = await register(name, email, password);
      setError('');
      setAccount(user);
      setAccountMenuOpen(false);
      setLoginOpen(false);
      return null;
    } catch {
      return 'Unable to register with this email.';
    }
  }

  async function handleLogout() {
    await logout();
    setAccount(null);
    setAccountMenuOpen(false);
  }

  return (
    <>
      <Header
        cartCount={cartCount}
        categories={categories}
        onOpenCart={() => setCartOpen(true)}
        onAccountClick={handleAccountClick}
        accountLabel={account ? `HI ${account.name.split(' ')[0].toUpperCase()}` : 'ACCT'}
        loggedIn={Boolean(account)}
        isAdmin={Boolean(account?.isAdmin)}
        onLogout={handleLogout}
        accountMenuOpen={accountMenuOpen}
      />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <section className="home-hero">
                <div className="home-hero-media" />
                <div className="home-hero-overlay shell">
                  <article className="hero-card fade-up">
                    <p className="hero-rating">***** 25,000+ Reviews</p>
                    <h1>Fuel Your Evolution</h1>
                    <p>Fully-dosed elite supplements that help you lift heavier, run farther, and live healthier.</p>
                    <button className="hero-cta" onClick={() => navigate(categoryTargets[0] ? `/category/${toCategorySlug(categoryTargets[0])}` : '/')}>
                      Shop All Supplements
                    </button>
                  </article>
                </div>
              </section>

              <main className="home-main shell-light">
                <section className="best-sellers">
                  <div className="section-row">
                    <h2>Best Sellers <span>New</span></h2>
                    <button className="pill-btn" onClick={() => navigate(categoryTargets[0] ? `/category/${toCategorySlug(categoryTargets[0])}` : '/')}>
                      View All
                    </button>
                  </div>
                  {loading && <p className="status">Loading products...</p>}
                  {!loading && error && <p className="status">{error}</p>}
                  <div className="seller-grid">
                    {bestSellers.map((product, i) => (
                      <article key={product.id} className="seller-card fade-up" onClick={() => navigate(`/product/${product.id}`)}>
                        <span className="best-tag">Best Seller</span>
                        <img src={product.image} alt={product.name} />
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                        <p className="seller-price">${product.price.toFixed(2)}</p>
                        <p className="seller-rating">***** {4.9 - i * 0.1} ({2740 - i * 385})</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="science-split">
                  <div className="science-left" />
                  <div className="science-right" />
                  <article className="science-copy">
                    <p>*****</p>
                    <h3>Science Driven. Athlete Trusted.</h3>
                    <span>
                      Fusion creates elite formulas built on research and trusted by athletes who
                      demand the best.
                    </span>
                    <button>Learn More</button>
                  </article>
                </section>

                <section className="goal-shop">
                  <h2>Shop By Goal</h2>
                  <div className="goal-tiles">
                    {categoryTargets.slice(0, 4).map((category, index) => (
                      <Link
                        key={category}
                        to={`/category/${toCategorySlug(category)}`}
                        className="goal-tile-link fade-up"
                        style={{
                          backgroundImage:
                            index === 0
                              ? "url('/images/whey.svg')"
                              : index === 1
                                ? "url('/images/preworkout.svg')"
                                : index === 2
                                  ? "url('/images/creatine.svg')"
                                  : "url('/images/default-product.svg')",
                        }}
                      >
                        <span>{category}</span>
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="featured-stacks">
                  <div className="section-row">
                    <h2>Featured Stacks</h2>
                    <button className="pill-btn" onClick={() => navigate(categoryTargets[1] ? `/category/${toCategorySlug(categoryTargets[1])}` : '/')}>
                      Shop All Stacks
                    </button>
                  </div>
                  <div className="stack-panels">
                    <article>
                      <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80" alt="Elite Performance Stack" />
                      <h3>Elite Performance Stack</h3>
                      <p>Three best-in-class supplements to elevate energy, strength, and recovery.</p>
                    </article>
                    <article>
                      <img src="https://images.unsplash.com/photo-1571731956672-f2b94d7dd0cb?auto=format&fit=crop&w=1200&q=80" alt="Daily Wellness Stack" />
                      <h3>Daily Wellness Stack</h3>
                      <p>Cover nutritional bases with essentials that keep you energized and healthy.</p>
                    </article>
                  </div>
                </section>

                <section className="value-marquee">
                  <p>Third-Party Tested</p>
                  <p>No Proprietary Blends</p>
                  <p>Subscribe & Save 20%</p>
                  <p>Fast 1-2 Day Shipping</p>
                  <p>60-Day Guarantee</p>
                </section>

                <section className="athlete-quote">
                  <h3>Trusted by Athletes Across Strength, Endurance, and Functional Fitness</h3>
                  <p>
                    "Fusion gives me clean energy and consistent output. It feels like a complete
                    performance system, not random supplements."
                  </p>
                  <span>- Jordan M., Competitive Hybrid Athlete</span>
                </section>

                <section className="final-cta">
                  <h3>Build Your Stack in 60 Seconds</h3>
                  <p>Answer a few questions and get your personalized daily routine.</p>
                  <button className="pill-btn" onClick={() => navigate(categoryTargets[0] ? `/category/${toCategorySlug(categoryTargets[0])}` : '/')}>
                    Start Stack Builder
                  </button>
                </section>
              </main>
            </>
          }
        />

        <Route
          path="/category/:categorySlug"
          element={<CategoryPage categories={categories} products={products} loading={loading} error={error} onDetails={(product) => navigate(`/product/${product.id}`)} onAdd={addToCart} />}
        />
        <Route path="/product/:productId" element={<ProductDetailPage products={products} onAdd={addToCart} />} />
        <Route path="/account" element={account ? <AccountPage userName={account.name} /> : <Navigate to="/" replace />} />
        <Route path="/admin" element={account?.isAdmin ? <AdminPage /> : <Navigate to="/" replace />} />
      </Routes>

      {cartCount > 0 && (
        <button className="mobile-cart-bar" onClick={() => setCartOpen(true)}>
          Cart ({cartCount}) - ${cartTotal.toFixed(2)}
        </button>
      )}

      <footer className="kaged-footer">
        <section className="footer-benefits">
          <article><h4>60-Day Money-Back Guarantee</h4><p>If you change your mind any time within 60 days, send it back.</p></article>
          <article><h4>Subscribe & Save 20%</h4><p>Pause, edit, or cancel anytime.</p></article>
          <article><h4>Fast Shipping</h4><p>Orders ship within 1-2 days.</p></article>
        </section>
        <section className="footer-links shell">
          <article className="newsletter"><p>Stay on track with your goals</p><h4>Receive tips, articles & offers from Fusion</h4><div><input placeholder="E-mail" /><button>Subscribe</button></div></article>
          <article><h5>Company</h5><p>About</p><p>Science</p><p>Careers</p></article>
          <article><h5>Support</h5><p>Help Center</p><p>Shipping & Returns</p><p>Reviews</p></article>
          <article><h5>Account & Rewards</h5><p>Manage Subscriptions</p><p>Distributor Login</p><p>Military Discount</p></article>
        </section>
        <div className="footer-wordmark">
          <span className="brand-mark" aria-hidden="true" />
          <span>FUSION</span>
        </div>
      </footer>

      {cartOpen && <CartDrawer items={cartItems} total={cartTotal} onClose={() => setCartOpen(false)} onStartCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} onUpdateQty={updateQuantity} onRemove={removeItem} />}
      {checkoutOpen && <CheckoutFlow items={cartItems} total={cartTotal} submitting={checkoutState === 'submitting'} onClose={() => setCheckoutOpen(false)} onPlaceOrder={handleCheckout} />}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} onLogin={handleLogin} onRegister={handleRegister} />}
    </>
  );
}
