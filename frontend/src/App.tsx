import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AccountPage } from './components/AccountPage';
import { AdminPage } from './components/AdminPage';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutFlow } from './components/CheckoutFlow';
import { ComparisonPage } from './components/ComparisonPage';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { ProductSection } from './components/ProductSection';
import { SearchDrawer } from './components/SearchDrawer';
import { StackBuilderPage } from './components/StackBuilderPage';
import { fallbackProducts } from './data/storefront';
import {
  fetchCategories,
  fetchProducts,
  fetchWishlist,
  getMe,
  addWishlistItem,
  login,
  logout,
  register,
  removeWishlistItem,
  resendVerification,
  sendWelcomePerkEmail,
  subscribeNewsletter,
  submitProductReview,
  submitAdvancedCheckout,
  trackAuthEvent,
  verifyEmail,
} from './lib/api';
import { getProductTypeLabel } from './lib/productLabels';
import type { CartItem, Product, User } from './types';

const currencyOptions = [
  { country: 'United States', flag: '🇺🇸', currency: 'USD', symbol: '$', rate: 1 },
  { country: 'European Union', flag: '🇪🇺', currency: 'EUR', symbol: '€', rate: 0.92 },
  { country: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', symbol: '£', rate: 0.79 },
  { country: 'Canada', flag: '🇨🇦', currency: 'CAD', symbol: 'C$', rate: 1.37 },
  { country: 'Australia', flag: '🇦🇺', currency: 'AUD', symbol: 'A$', rate: 1.53 },
  { country: 'Japan', flag: '🇯🇵', currency: 'JPY', symbol: '¥', rate: 153.5 },
];

function toCategorySlug(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function formatStars(rating: number): string {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(rounded);
}

const infoPages: Record<string, { title: string; eyebrow: string; body: string[] }> = {
  about: {
    eyebrow: 'Company',
    title: 'About Fusion',
    body: [
      'Fusion is built for lifters and everyday athletes who want clear formulas, reliable routines, and fewer confusing supplement choices.',
      'Every product page highlights the goal, usage, ingredients, and testing claims a customer needs before adding it to a stack.',
    ],
  },
  science: {
    eyebrow: 'Science',
    title: 'Formula Standards',
    body: [
      'Our product standards focus on transparent labels, practical serving sizes, and ingredient combinations that make sense for training, recovery, and daily wellness.',
      'This page is ready for deeper citations, lab certificates, and ingredient explainers as the catalog grows.',
    ],
  },
  careers: {
    eyebrow: 'Company',
    title: 'Careers',
    body: ['Fusion is not hiring through this demo store yet.', 'Future roles can be listed here for operations, customer support, performance nutrition, and ecommerce.'],
  },
  help: {
    eyebrow: 'Support',
    title: 'Help Center',
    body: [
      'Customers can manage account details, view orders, submit support tickets, and request returns from the account dashboard.',
      'For a live store, this page should include contact hours, FAQ categories, and response-time expectations.',
    ],
  },
  returns: {
    eyebrow: 'Support',
    title: 'Shipping & Returns',
    body: ['Orders currently support standard and express shipping options during checkout.', 'Return requests can be submitted from the account support section and tracked by the support team.'],
  },
  reviews: {
    eyebrow: 'Community',
    title: 'Customer Reviews',
    body: ['Product reviews are shown on product pages from catalog data.', 'The next step is verified-buyer review submission, moderation, and review filtering.'],
  },
  subscriptions: {
    eyebrow: 'Account',
    title: 'Manage Subscriptions',
    body: [
      'Checkout can record subscription frequency, but real recurring billing is not connected yet.',
      'Once Stripe subscriptions are added, this page can become the customer portal entry point.',
    ],
  },
  distributor: {
    eyebrow: 'Partners',
    title: 'Distributor Login',
    body: ['Wholesale and distributor access is not active yet.', 'This page can later support partner pricing, bulk orders, and sales rep accounts.'],
  },
  military: {
    eyebrow: 'Discounts',
    title: 'Military Discount',
    body: [
      'A dedicated discount verification flow is not connected yet.',
      'For now, admins can create a coupon code from the dashboard and share it with approved customers.',
    ],
  },
};

function InfoPage({ pageKey }: { pageKey: keyof typeof infoPages }) {
  const page = infoPages[pageKey];
  return (
    <main className="shell page-block">
      <section className="page-banner">
        <p>{page.eyebrow}</p>
        <h2>{page.title}</h2>
      </section>
      <section className="account-panel info-panel">
        {page.body.map((paragraph) => (
          <p key={paragraph} className="state">{paragraph}</p>
        ))}
      </section>
    </main>
  );
}

function CategoryPage({
  categories,
  products,
  loading,
  error,
  onDetails,
  onAdd,
  wishlistProductIds,
  onToggleWishlist,
  formatPrice,
}: {
  categories: string[];
  products: Product[];
  loading: boolean;
  error: string;
  onDetails: (product: Product) => void;
  onAdd: (product: Product) => void;
  wishlistProductIds: number[];
  onToggleWishlist: (product: Product) => void;
  formatPrice: (usdAmount: number) => string;
}) {
  const navigate = useNavigate();
  const { categorySlug } = useParams();
  const selectedCategory = categories.find((category) => toCategorySlug(category) === categorySlug);

  if (loading && !selectedCategory) {
    return (
      <main className="shell page-block">
        <p className="state">Loading category...</p>
      </main>
    );
  }

  if (!selectedCategory) {
    return <Navigate to="/" replace />;
  }

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter((product) => product.category === selectedCategory);

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
        onCategoryChange={(category) => {
          if (category === 'All') {
            navigate('/category/all');
            return;
          }
          navigate(`/category/${toCategorySlug(category)}`);
        }}
        onDetails={onDetails}
        onAdd={onAdd}
        wishlistProductIds={wishlistProductIds}
        onToggleWishlist={onToggleWishlist}
        formatPrice={formatPrice}
      />
    </main>
  );
}

function ProductDetailPage({
  products,
  loading,
  onAdd,
  account,
  formatPrice,
  wishlistProductIds,
  onToggleWishlist,
  onReviewSubmitted,
}: {
  products: Product[];
  loading: boolean;
  onAdd: (product: Product) => void;
  account: User | null;
  formatPrice: (usdAmount: number) => string;
  wishlistProductIds: number[];
  onToggleWishlist: (product: Product) => void;
  onReviewSubmitted: (productId: number, review: NonNullable<Product['reviews']>[number]) => void;
}) {
  const navigate = useNavigate();
  const { productId } = useParams();
  const product = products.find((entry) => entry.id === Number(productId));
  const galleryImages = product?.images && product.images.length > 0 ? product.images : product ? [product.image] : [];
  const [activeImage, setActiveImage] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewState, setReviewState] = useState('');
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [productId]);
  useEffect(() => {
    setActiveImage(galleryImages[0] ?? '');
  }, [productId, galleryImages[0]]);

  if (loading) {
    return (
      <main className="shell page-block">
        <p className="state">Loading product...</p>
      </main>
    );
  }

  if (!product) return <Navigate to="/" replace />;
  const currentProduct = product;
  const currentImage = activeImage || galleryImages[0];

  const relatedProducts = products
    .filter((entry) => entry.category === product.category && entry.id !== product.id)
    .slice(0, 3);

  const ingredients = product.ingredients ?? ['Active Performance Blend', 'Electrolyte Matrix', 'Digestive Enzyme Support'];
  const facts = product.supplementFacts;
  const isLowStock =
    product.inStock !== false &&
    typeof product.stockQuantity === 'number' &&
    typeof product.lowStockThreshold === 'number' &&
    product.stockQuantity <= product.lowStockThreshold;
  const faqs =
    product.faqs ??
    [
      { q: 'When should I take this?', a: 'Use 20-30 minutes before training or as part of your daily routine.' },
      { q: 'Is it third-party tested?', a: 'Yes, each batch is tested for purity and label accuracy.' },
      { q: 'Can I stack this with other products?', a: 'Yes, this product is designed to pair with protein and recovery formulas.' },
    ];
  const reviews =
    product.reviews?.map((review) => ({ name: review.name, score: review.rating, body: review.text, verified: review.verifiedPurchase })) ??
    [
      { name: 'Alex M.', score: 5, body: 'Noticeable boost in training output and better recovery by week two.', verified: false },
      { name: 'Sam R.', score: 5, body: 'Tastes great and mixes fast. Solid daily staple.', verified: false },
      { name: 'Jordan T.', score: 4, body: 'Clean formula and no crash. Works exactly as expected.', verified: false },
    ];

  async function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account) {
      setReviewState('Please log in to submit a verified review.');
      return;
    }
    setReviewState('Saving review...');
    try {
      const review = await submitProductReview(currentProduct.id, { rating: reviewRating, text: reviewText });
      onReviewSubmitted(currentProduct.id, review);
      setReviewText('');
      setReviewState('Review saved as a verified purchase.');
    } catch (error) {
      setReviewState(error instanceof Error ? error.message : 'Unable to save review.');
    }
  }

  return (
    <main className="shell page-block">
      <section className="pdp-layout">
        <div>
          <img className="pdp-image" src={currentImage} alt={product.name} />
          {galleryImages.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              {galleryImages.map((img) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  style={{
                    border: currentImage === img ? '2px solid #2a9d8f' : '1px solid #d6d6d6',
                    borderRadius: '8px',
                    padding: '0',
                    width: '64px',
                    height: '64px',
                    overflow: 'hidden',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <img src={img} alt={`${product.name} preview`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>
        <article className="pdp-main">
          <p className="label">{getProductTypeLabel(product)}</p>
          <h1>{product.name}</h1>
          <p className="label">
            {[product.brand, product.flavor, product.servings ? `${product.servings} servings` : null].filter(Boolean).join(' | ')}
          </p>
          <p className="pdp-description">{product.description}</p>
          <p className="pdp-price">{formatPrice(product.price)}</p>
          {product.inStock === false && <p className="state warn">This product is currently out of stock.</p>}
          {isLowStock && <p className="state warn">Low stock: only {product.stockQuantity} left.</p>}
          {product.inStock !== false && !isLowStock && typeof product.stockQuantity === 'number' && <p className="state">{product.stockQuantity} units available.</p>}
          <div className="pdp-certs">
            {(product.certifications ?? ['Lab Tested', 'GMP']).map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
          <div className="pdp-actions">
            <button className="btn btn-solid" disabled={product.inStock === false} onClick={() => onAdd(product)}>
              {product.inStock === false ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button className="btn btn-ghost" onClick={() => onToggleWishlist(product)}>
              {wishlistProductIds.includes(product.id) ? 'Saved' : 'Save'}
            </button>
            <button className="btn btn-ghost" onClick={() => navigate(-1)}>Back</button>
          </div>
        </article>
      </section>

      <section className="pdp-grid">
        <article className="pdp-card">
          <h3>Ingredients</h3>
          {ingredients.map((item) => <p key={item}>{item}</p>)}
        </article>
        <article className="pdp-card supplement-facts">
          <h3>Supplement Facts</h3>
          <p>Serving size: {facts?.servingSize ?? '1 serving'}</p>
          <p>Servings: {facts?.servingsPerContainer ?? product.servings ?? 'Varies'}</p>
          {(facts?.highlights ?? ingredients.slice(0, 3)).map((item) => <p key={item}>{item}</p>)}
        </article>
        <article className="pdp-card">
          <h3>Usage</h3>
          <p>{product.usage ?? 'Mix one scoop with 300-400ml of cold water.'}</p>
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
        <form className="login-form review-form" onSubmit={handleReviewSubmit}>
          <label>Rating
            <select className="checkout-input" value={reviewRating} onChange={(event) => setReviewRating(Number(event.target.value))}>
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
            </select>
          </label>
          <label>Review
            <input value={reviewText} onChange={(event) => setReviewText(event.target.value)} placeholder="Share what changed in your training..." />
          </label>
          <button className="btn btn-solid" type="submit">Submit Verified Review</button>
          {reviewState && <p className="state">{reviewState}</p>}
        </form>
        {reviews.map((review) => (
          <article key={review.name} className="review-row">
            <p><span className="rating-stars">{'★'.repeat(review.score)}</span> by {review.name}</p>
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
                <img className="product-image" src={related.image} alt={related.name} />
                <p className="label">{getProductTypeLabel(related)}</p>
                <h3>{related.name}</h3>
                <p>{related.description}</p>
                <div className="product-foot">
                  <span>{formatPrice(related.price)}</span>
                  <div className="actions">
                    <button className="btn btn-ghost" onClick={() => navigate(`/product/${related.id}`)}>View</button>
                    <button className="btn btn-solid mini" disabled={related.inStock === false} onClick={() => onAdd(related)}>
                      {related.inStock === false ? 'Out' : 'Add'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      {account?.goal && (
        <section className="pdp-card">
          <h3>Recommended For Your Goal</h3>
          {products
            .filter((entry) => (entry.goals ?? []).some((goal) => goal.toLowerCase().includes(account.goal!.toLowerCase())))
            .slice(0, 3)
            .map((entry) => (
              <p key={entry.id}>{entry.name}</p>
            ))}
        </section>
      )}
    </main>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeBundleCode, setActiveBundleCode] = useState('');
  const [checkoutState, setCheckoutState] = useState<'idle' | 'submitting'>('idle');
  const [loginOpen, setLoginOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [account, setAccount] = useState<User | null>(null);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedCountry, setSelectedCountry] = useState('United States');
  const [cookieAccepted, setCookieAccepted] = useState(true);
  const [welcomePerkOpen, setWelcomePerkOpen] = useState(false);
  const [welcomeCouponCode, setWelcomeCouponCode] = useState('');
  const [welcomePerkState, setWelcomePerkState] = useState('');
  const [welcomePerkClaimedBefore, setWelcomePerkClaimedBefore] = useState(false);
  const [scratchReady, setScratchReady] = useState(false);
  const [scratchClaimed, setScratchClaimed] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterState, setNewsletterState] = useState('');
  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart_items');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart) as CartItem[];
        setCartItems(parsedCart.filter((item) => item.inStock !== false && item.quantity > 0));
      } catch {
        localStorage.removeItem('cart_items');
      }
    }
    const savedCurrency = localStorage.getItem('currency_code');
    const savedCountry = localStorage.getItem('currency_country');
    if (savedCurrency) setSelectedCurrency(savedCurrency);
    if (savedCountry) setSelectedCountry(savedCountry);
    const consent = localStorage.getItem('cookie_consent');
    setCookieAccepted(consent === 'accepted');
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

  useEffect(() => {
    function onUnload() {
      if (account && cartItems.length > 0) {
        void trackAuthEvent('cart_abandoned', account.email, { itemCount: cartItems.length });
      }
    }
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [account, cartItems]);

  useEffect(() => {
    localStorage.setItem('currency_code', selectedCurrency);
    localStorage.setItem('currency_country', selectedCountry);
  }, [selectedCurrency, selectedCountry]);

  useEffect(() => {
    if (!account) {
      setWishlistProducts([]);
      return;
    }
    fetchWishlist().then(setWishlistProducts).catch(() => setWishlistProducts([]));
  }, [account]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const activeCurrency = currencyOptions.find((entry) => entry.currency === selectedCurrency) ?? currencyOptions[0];
  const convertPrice = (usdAmount: number) => usdAmount * activeCurrency.rate;
  const formatPrice = (usdAmount: number) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: activeCurrency.currency,
      maximumFractionDigits: activeCurrency.currency === 'JPY' ? 0 : 2,
    }).format(convertPrice(usdAmount));
  const bestSellers = useMemo(() => products.slice(0, 4), [products]);
  const categoryTargets = useMemo(() => categories.filter((category) => category !== 'All'), [categories]);
  const categoryHeroImages = useMemo(() => {
    const map: Record<string, string> = {};
    for (const category of categoryTargets) {
      const featuredInCategory = products.find((product) => product.category === category && product.featured);
      const fallbackInCategory = products.find((product) => product.category === category);
      const image =
        featuredInCategory?.images?.[0] ??
        featuredInCategory?.image ??
        fallbackInCategory?.images?.[0] ??
        fallbackInCategory?.image;
      if (image) {
        map[category] = image;
      }
    }
    return map;
  }, [products, categoryTargets]);
  const allReviews = useMemo(() => products.flatMap((product) => product.reviews ?? []), [products]);
  const wishlistProductIds = useMemo(() => wishlistProducts.map((product) => product.id), [wishlistProducts]);
  const globalRating = useMemo(() => {
    if (!allReviews.length) return 0;
    return allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;
  }, [allReviews]);

  function addToCart(product: Product) {
    if (product.inStock === false) {
      setError(`${product.name} is currently out of stock.`);
      return;
    }
    setCartItems((prev) => {
      const found = prev.find((item) => item.id === product.id);
      if (found) {
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setActiveBundleCode('');
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
    if (!account) {
      setCheckoutOpen(false);
      setLoginOpen(true);
      setError('Please log in before checkout.');
      return;
    }
    if (!account.emailVerified) {
      setCheckoutOpen(false);
      navigate('/account');
      setError('Please verify your email before checkout.');
      return;
    }
    try {
      setError('');
      setCheckoutState('submitting');
      await submitAdvancedCheckout({
        items: cartItems.map((item) => ({ id: item.id, quantity: item.quantity })),
        promoCode: payload.promoCode,
        bundleCode: activeBundleCode || undefined,
        shippingMethod: payload.shippingMethod,
        subscribeFrequency: payload.subscribeFrequency,
        shipping: payload.shipping,
      });
      setCartItems([]);
      setActiveBundleCode('');
      setCheckoutOpen(false);
      setCartOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Checkout failed. Please verify details.');
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
      setWelcomeCouponCode(user.welcomeCoupon || 'WELCOME10');
      setWelcomePerkState('');
      setWelcomePerkClaimedBefore(Boolean(user.welcomePerkClaimedAt));
      setScratchReady(false);
      setScratchClaimed(false);
      setWelcomePerkOpen(true);
      return null;
    } catch {
      return 'Invalid email or password.';
    }
  }

  async function handleRegister(name: string, email: string, password: string): Promise<string | null> {
    try {
      const result = await register(name, email, password);
      setError('');
      setAccount(result.user);
      setAccountMenuOpen(false);
      setLoginOpen(false);
      setRegisterSuccess('Account created successfully. You are now logged in.');
      setWelcomeCouponCode(result.welcomeCoupon || 'WELCOME10');
      setWelcomePerkState('');
      setWelcomePerkClaimedBefore(Boolean(result.user.welcomePerkClaimedAt));
      setScratchReady(false);
      setScratchClaimed(false);
      setWelcomePerkOpen(true);
      await trackAuthEvent('register_funnel_completed', email, { hasWelcomeCoupon: Boolean(result.welcomeCoupon) });
      navigate('/account');
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'Unable to register with this email.';
    }
  }

  async function handleVerifyEmail(email: string, token: string): Promise<boolean> {
    const ok = await verifyEmail(email, token);
    if (ok) {
      const next = await getMe();
      setAccount(next);
    }
    return ok;
  }

  async function handleResendVerification(email: string): Promise<string | null> {
    const result = await resendVerification(email);
    return result.verificationToken ?? null;
  }

  async function handleLogout() {
    await logout();
    setAccount(null);
    setWishlistProducts([]);
    setAccountMenuOpen(false);
  }

  async function handleToggleWishlist(product: Product) {
    if (!account) {
      setLoginOpen(true);
      setError('Please log in to save favorites.');
      return;
    }
    try {
      const next = wishlistProductIds.includes(product.id)
        ? await removeWishlistItem(product.id)
        : await addWishlistItem(product.id);
      setWishlistProducts(next);
      setError('');
    } catch {
      setError('Unable to update wishlist right now.');
    }
  }

  function handleReviewSubmitted(productId: number, review: NonNullable<Product['reviews']>[number]) {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
              ...product,
              reviews: [
                review,
                ...(product.reviews ?? []).filter((entry) => !(entry.name === review.name && entry.verifiedPurchase)),
              ],
            }
          : product
      )
    );
  }

  async function handleNewsletterSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNewsletterState('Signing up...');
    try {
      const result = await subscribeNewsletter(newsletterEmail.trim().toLowerCase());
      setNewsletterEmail('');
      setNewsletterState(`You're in. Use ${result.couponCode} for your launch discount.`);
    } catch (error) {
      setNewsletterState(error instanceof Error ? error.message : 'Newsletter signup failed.');
    }
  }

  function handleReorder(items: Array<{ id: number; quantity: number }>) {
    const next = items
      .map((item) => {
        const found = products.find((product) => product.id === item.id);
        return found ? { ...found, quantity: Math.max(1, item.quantity) } : null;
      })
      .filter((value): value is CartItem => Boolean(value));
    if (!next.length) return;
    setCartItems(next);
    setActiveBundleCode('');
    setCartOpen(true);
  }

  function handleAddBundle(bundleCode: string, productIds: readonly number[]) {
    const bundleItems = productIds
      .map((id) => products.find((product) => product.id === id))
      .filter((product): product is Product => product !== undefined && product.inStock !== false)
      .map((product) => ({ ...product, quantity: 1 }));
    if (!bundleItems.length) return;
    setCartItems((prev) => {
      let next = [...prev];
      for (const product of bundleItems) {
        const found = next.find((item) => item.id === product.id);
        if (found) {
          next = next.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
          next.push(product);
        }
      }
      return next;
    });
    setActiveBundleCode(bundleCode);
    setCartOpen(true);
  }

  useEffect(() => {
    if (!welcomePerkOpen) return;
    const canvas = scratchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const safeCanvas = canvas;
    const safeCtx = ctx;

    const width = safeCanvas.clientWidth || 480;
    const height = safeCanvas.clientHeight || 110;
    safeCanvas.width = width;
    safeCanvas.height = height;
    safeCtx.globalCompositeOperation = 'source-over';
    safeCtx.fillStyle = '#202632';
    safeCtx.fillRect(0, 0, width, height);
    safeCtx.fillStyle = '#f5f5f5';
    safeCtx.font = "700 20px 'Barlow Condensed'";
    safeCtx.textAlign = 'center';
    safeCtx.fillText('Scratch To Claim', width / 2, height / 2 + 7);
    safeCtx.globalCompositeOperation = 'destination-out';
    setScratchReady(true);
    setScratchClaimed(false);

    let down = false;
    let revealed = false;
    function pointerPos(event: PointerEvent) {
      const rect = safeCanvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }
    function scratch(event: PointerEvent) {
      if (!down || revealed) return;
      const { x, y } = pointerPos(event);
      safeCtx.beginPath();
      safeCtx.arc(x, y, 15, 0, Math.PI * 2);
      safeCtx.fill();
      const data = safeCtx.getImageData(0, 0, width, height).data;
      let transparent = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 20) transparent += 1;
      }
      const ratio = transparent / (width * height);
      if (ratio > 0.42) {
        revealed = true;
        setScratchClaimed(true);
      }
    }
    function onDown(event: PointerEvent) {
      down = true;
      scratch(event);
    }
    function onUp() {
      down = false;
    }
    safeCanvas.addEventListener('pointerdown', onDown);
    safeCanvas.addEventListener('pointermove', scratch);
    window.addEventListener('pointerup', onUp);
    return () => {
      safeCanvas.removeEventListener('pointerdown', onDown);
      safeCanvas.removeEventListener('pointermove', scratch);
      window.removeEventListener('pointerup', onUp);
    };
  }, [welcomePerkOpen]);

  useEffect(() => {
    if (!scratchClaimed || !welcomePerkOpen) return;
    (async () => {
      const result = await sendWelcomePerkEmail();
      setWelcomePerkState(
        result.alreadyClaimed ? 'Already claimed before. Coupon email was not sent again.' : 'Coupon sent directly to your email.'
      );
      setScratchReady(false);
    })().catch(() => setWelcomePerkState('Unable to send email right now.'));
  }, [scratchClaimed, welcomePerkOpen]);

  return (
    <>
        <Header
          cartCount={cartCount}
          categories={categories}
        onOpenCart={() => setCartOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onAccountClick={handleAccountClick}
          loggedIn={Boolean(account)}
          isAdmin={Boolean(account?.isAdmin)}
          onLogout={handleLogout}
          accountMenuOpen={accountMenuOpen}
          selectedCountry={selectedCountry}
          selectedCurrency={selectedCurrency}
          onCurrencyChange={(currencyCode, countryLabel) => {
            setSelectedCurrency(currencyCode);
            setSelectedCountry(countryLabel);
          }}
          currencyOptions={currencyOptions}
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
                    <p className="hero-rating">{formatStars(globalRating)} {globalRating.toFixed(1)} from {allReviews.length} verified reviews</p>
                    <h1>Fuel Your Evolution</h1>
                    <p>Fully-dosed elite supplements that help you lift heavier, run farther, and live healthier.</p>
                    <button className="hero-cta" onClick={() => navigate('/category/all')}>
                      Shop All Supplements
                    </button>
                  </article>
                </div>
              </section>

              <main className="home-main shell-light">
                <section className="best-sellers">
                  <div className="section-row">
                    <h2>Best Sellers <span>New</span></h2>
                    <div className="actions">
                      <button className="pill-btn" onClick={() => navigate('/compare')}>Compare</button>
                      <button className="pill-btn" onClick={() => navigate('/category/all')}>
                        View All
                      </button>
                    </div>
                  </div>
                  {loading && <p className="status">Loading products...</p>}
                  {!loading && error && <p className="status">{error}</p>}
                  <div className="seller-grid">
                    {bestSellers.map((product) => (
                      <article key={product.id} className="seller-card fade-up" onClick={() => navigate(`/product/${product.id}`)}>
                        <span className="best-tag">Best Seller</span>
                        <img src={product.image} alt={product.name} />
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                        <p className="seller-price">{formatPrice(product.price)}</p>
                        <p className="seller-rating">
                          {formatStars((product.reviews ?? []).reduce((sum, review) => sum + review.rating, 0) / Math.max(1, (product.reviews ?? []).length))}
                          {' '}
                          {((product.reviews ?? []).reduce((sum, review) => sum + review.rating, 0) / Math.max(1, (product.reviews ?? []).length)).toFixed(1)}
                          {' '}
                          ({(product.reviews ?? []).length} reviews)
                        </p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="science-split">
                  <div className="science-left" />
                  <div className="science-right" />
                  <article className="science-copy">
                    <p>{formatStars(globalRating)} {globalRating.toFixed(1)} average rating</p>
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
                          backgroundImage: categoryHeroImages[category]
                            ? `url('${categoryHeroImages[category]}')`
                            : index === 0
                              ? "url('https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=1000&q=80')"
                              : index === 1
                                ? "url('https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=1000&q=80')"
                                : index === 2
                                  ? "url('https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?auto=format&fit=crop&w=1000&q=80')"
                                  : "url('https://images.unsplash.com/photo-1594737625785-c936d2e6cd17?auto=format&fit=crop&w=1000&q=80')",
                        }}
                      >
                        <span>{category}</span>
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="featured-stacks" id="starter-bundle">
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
                      <button className="btn btn-solid mini" onClick={() => handleAddBundle('PERFORMANCE', [3, 2, 6])}>Add Stack</button>
                    </article>
                    <article>
                      <img src="https://images.unsplash.com/photo-1571731956672-f2b94d7dd0cb?auto=format&fit=crop&w=1200&q=80" alt="Daily Wellness Stack" />
                      <h3>Daily Wellness Stack</h3>
                      <p>Cover nutritional bases with essentials that keep you energized and healthy.</p>
                      <button className="btn btn-solid mini" onClick={() => handleAddBundle('WELLNESS', [4, 5, 6])}>Add Stack</button>
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
                  <button className="pill-btn" onClick={() => navigate('/stack-builder')}>
                    Start Stack Builder
                  </button>
                </section>
              </main>
            </>
          }
        />

        <Route
          path="/category/:categorySlug"
          element={<CategoryPage categories={categories} products={products} loading={loading} error={error} onDetails={(product) => navigate(`/product/${product.id}`)} onAdd={addToCart} wishlistProductIds={wishlistProductIds} onToggleWishlist={handleToggleWishlist} formatPrice={formatPrice} />}
        />
        <Route path="/product/:productId" element={<ProductDetailPage products={products} loading={loading} onAdd={addToCart} account={account} formatPrice={formatPrice} wishlistProductIds={wishlistProductIds} onToggleWishlist={handleToggleWishlist} onReviewSubmitted={handleReviewSubmitted} />} />
        <Route path="/compare" element={<ComparisonPage products={products} formatPrice={formatPrice} />} />
        <Route path="/stack-builder" element={<StackBuilderPage products={products} formatPrice={formatPrice} onAddBundle={handleAddBundle} />} />
        <Route
          path="/account"
          element={account ? <AccountPage account={account} products={products} formatPrice={formatPrice} onResendVerification={handleResendVerification} onVerifyEmail={handleVerifyEmail} onProfileSaved={async () => {
            const next = await getMe();
            setAccount(next);
          }} onReorder={handleReorder} wishlistProducts={wishlistProducts} onToggleWishlist={handleToggleWishlist} onAdd={addToCart} /> : <Navigate to="/" replace />}
        />
        <Route path="/admin" element={account?.isAdmin ? <AdminPage formatPrice={formatPrice} /> : <Navigate to="/" replace />} />
        <Route path="/about" element={<InfoPage pageKey="about" />} />
        <Route path="/science" element={<InfoPage pageKey="science" />} />
        <Route path="/careers" element={<InfoPage pageKey="careers" />} />
        <Route path="/help" element={<InfoPage pageKey="help" />} />
        <Route path="/returns" element={<InfoPage pageKey="returns" />} />
        <Route path="/reviews" element={<InfoPage pageKey="reviews" />} />
        <Route path="/subscriptions" element={<InfoPage pageKey="subscriptions" />} />
        <Route path="/distributor" element={<InfoPage pageKey="distributor" />} />
        <Route path="/military" element={<InfoPage pageKey="military" />} />
        <Route path="/privacy" element={<main className="shell page-block"><section className="account-panel"><h3>Privacy Policy</h3><p className="state">We store account, order, and preference data to provide checkout, support, and personalization. You can request data export or deletion from your account support section.</p></section></main>} />
        <Route path="/terms" element={<main className="shell page-block"><section className="account-panel"><h3>Terms</h3><p className="state">By using this store you agree to account, purchase, and returns policies. Subscription orders can be edited or cancelled anytime before renewal.</p></section></main>} />
      </Routes>

      {cartCount > 0 && (
        <button className="mobile-cart-bar" onClick={() => setCartOpen(true)}>
          Cart ({cartCount}) - {formatPrice(cartTotal)}
        </button>
      )}

      <footer className="kaged-footer">
        <section className="footer-benefits">
          <article><h4>60-Day Money-Back Guarantee</h4><p>If you change your mind any time within 60 days, send it back.</p></article>
          <article><h4>Subscribe & Save 20%</h4><p>Pause, edit, or cancel anytime.</p></article>
          <article><h4>Fast Shipping</h4><p>Orders ship within 1-2 days.</p></article>
        </section>
        <section className="footer-links shell">
          <article className="newsletter">
            <p>Stay on track with your goals</p>
            <h4>Receive tips, articles & offers from Fusion</h4>
            <form onSubmit={handleNewsletterSignup}>
              <input placeholder="E-mail" value={newsletterEmail} onChange={(event) => setNewsletterEmail(event.target.value)} />
              <button type="submit">Subscribe</button>
            </form>
            {newsletterState && <p className="state">{newsletterState}</p>}
          </article>
          <article><h5>Company</h5><Link to="/about">About</Link><Link to="/science">Science</Link><Link to="/careers">Careers</Link></article>
          <article><h5>Support</h5><Link to="/help">Help Center</Link><Link to="/returns">Shipping & Returns</Link><Link to="/reviews">Reviews</Link><Link to="/privacy">Privacy Policy</Link><Link to="/terms">Terms</Link></article>
          <article><h5>Account & Rewards</h5><Link to="/subscriptions">Manage Subscriptions</Link><Link to="/distributor">Distributor Login</Link><Link to="/military">Military Discount</Link></article>
        </section>
        <div className="footer-wordmark">
          <span className="brand-mark" aria-hidden="true" />
          <span>FUSION</span>
        </div>
      </footer>

      {cartOpen && <CartDrawer items={cartItems} total={cartTotal} bundleCode={activeBundleCode} formatPrice={formatPrice} onClose={() => setCartOpen(false)} onStartCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} onUpdateQty={updateQuantity} onRemove={removeItem} />}
      {searchOpen && <SearchDrawer products={products} formatPrice={formatPrice} onClose={() => setSearchOpen(false)} />}
      {checkoutOpen && <CheckoutFlow items={cartItems} total={cartTotal} formatPrice={formatPrice} submitting={checkoutState === 'submitting'} onClose={() => setCheckoutOpen(false)} onPlaceOrder={handleCheckout} />}
      {loginOpen && (
        <LoginModal
          onClose={() => setLoginOpen(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onVerifyEmail={handleVerifyEmail}
          onResendVerification={handleResendVerification}
        />
      )}
      {registerSuccess && <div className="state" style={{ position: 'fixed', bottom: 12, right: 12 }}>{registerSuccess}</div>}
      {!cookieAccepted && (
        <div className="account-panel" style={{ position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 120 }}>
          <p className="state">We use cookies for login sessions, checkout, and analytics.</p>
          <div className="actions">
            <button className="btn btn-solid" onClick={() => { localStorage.setItem('cookie_consent', 'accepted'); setCookieAccepted(true); }}>Accept</button>
            <button className="btn btn-ghost" onClick={() => { localStorage.setItem('cookie_consent', 'declined'); setCookieAccepted(true); }}>Decline non-essential</button>
          </div>
        </div>
      )}
      {welcomePerkOpen && (
        <section className="overlay" role="dialog" aria-modal="true" aria-label="Welcome perks">
          <div className="modal welcome-perk-modal">
            <div className="modal-head welcome-perk-head">
              <h3>Welcome Reward Unlocked</h3>
              {welcomePerkClaimedBefore && <span className="welcome-perk-badge">Already Claimed</span>}
              <button className="btn btn-ghost" onClick={() => setWelcomePerkOpen(false)}>Close</button>
            </div>
            <p className="welcome-perk-copy">Use your launch perks now or send them straight to your inbox for later.</p>
            <div className={`welcome-scratch-wrap ${scratchClaimed ? 'claimed' : ''}`}>
              <div className="welcome-scratch-reveal">
                <p>Reward Claimed</p>
                <strong>Check Your Email</strong>
                <span>Your private coupon was delivered securely.</span>
              </div>
              {!scratchClaimed && <canvas ref={scratchCanvasRef} className="welcome-scratch-canvas" />}
            </div>
            <div className="welcome-perk-grid">
              <article>
                <h4>Free Shipping</h4>
                <p>Automatically unlocks on orders over $70.</p>
              </article>
              <article>
                <h4>Starter Bundle</h4>
                <p>Begin with Whey + Creatine + Electrolytes.</p>
              </article>
            </div>
            <div className="welcome-perk-actions">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setWelcomePerkOpen(false);
                  navigate('/');
                  setTimeout(() => {
                    const target = document.getElementById('starter-bundle');
                    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 60);
                }}
              >
                View Starter Bundle
              </button>
            </div>
            <p className={`state welcome-perk-state ${scratchClaimed ? 'success' : ''}`}>
              {welcomePerkState || (scratchReady ? 'Scratch card to claim your coupon by email.' : 'Preparing scratch card...')}
            </p>
          </div>
        </section>
      )}
    </>
  );
}
