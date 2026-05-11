import { useState } from 'react';
import { NavLink } from 'react-router-dom';

type HeaderProps = {
  cartCount: number;
  categories: string[];
  onOpenCart: () => void;
  onOpenSearch: () => void;
  onAccountClick: () => void;
  loggedIn: boolean;
  isAdmin?: boolean;
  onLogout: () => void;
  accountMenuOpen: boolean;
  selectedCountry: string;
  selectedCurrency: string;
  onCurrencyChange: (currencyCode: string, countryLabel: string) => void;
  currencyOptions: Array<{ country: string; flag: string; currency: string; symbol: string }>;
};

function toCategorySlug(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function Header({
  cartCount,
  categories,
  onOpenCart,
  onOpenSearch,
  onAccountClick,
  loggedIn,
  isAdmin = false,
  onLogout,
  accountMenuOpen,
  selectedCountry,
  selectedCurrency,
  onCurrencyChange,
  currencyOptions,
}: HeaderProps) {
  const navCategories = categories.filter((category) => category !== 'All');
  const shopTarget = navCategories[0] ?? 'Protein';
  const scienceTarget = navCategories[1] ?? shopTarget;
  const stackTarget = navCategories[2] ?? shopTarget;
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const selected = currencyOptions.find((entry) => entry.currency === selectedCurrency) ?? currencyOptions[0];

  return (
    <>
      <header className="announce">
        <p>Free US Shipping Over $70</p>
      </header>

      <nav className="main-nav">
        <div className="shell nav-inner">
          <ul className="nav-links">
            <li
              className={`nav-shop${shopOpen ? ' open' : ''}`}
              onMouseEnter={() => setShopOpen(true)}
              onMouseLeave={() => setShopOpen(false)}
            >
              <NavLink to={`/category/${toCategorySlug(shopTarget)}`} onClick={() => setShopOpen(false)}>Shop</NavLink>
              <div className="mega-menu">
                <article>
                  <h6>Category</h6>
                  {navCategories.slice(0, 8).map((category) => (
                    <NavLink key={category} to={`/category/${toCategorySlug(category)}`} onClick={() => setShopOpen(false)}>{category}</NavLink>
                  ))}
                </article>
                <article>
                  <h6>Goal</h6>
                  <NavLink to={`/category/${toCategorySlug(shopTarget)}`} onClick={() => setShopOpen(false)}>Build Muscle</NavLink>
                  <NavLink to={`/category/${toCategorySlug(scienceTarget)}`} onClick={() => setShopOpen(false)}>Athletic Performance</NavLink>
                  <NavLink to={`/category/${toCategorySlug(stackTarget)}`} onClick={() => setShopOpen(false)}>Weight Management</NavLink>
                  <NavLink to={`/category/${toCategorySlug(shopTarget)}`} onClick={() => setShopOpen(false)}>Health & Wellness</NavLink>
                </article>
                <article>
                  <h6>Best Sellers</h6>
                  <NavLink to={`/category/${toCategorySlug(shopTarget)}`} onClick={() => setShopOpen(false)}>Hydra Surge</NavLink>
                  <NavLink to={`/category/${toCategorySlug(scienceTarget)}`} onClick={() => setShopOpen(false)}>Pure Isolate</NavLink>
                  <NavLink to={`/category/${toCategorySlug(stackTarget)}`} onClick={() => setShopOpen(false)}>Ignite Pre</NavLink>
                </article>
                <article className="mega-highlight">
                  <img src="https://images.unsplash.com/photo-1517964603305-11c0f6f66012?auto=format&fit=crop&w=700&q=80" alt="Just launched products" />
                  <p>Just Launched</p>
                  <span>On-the-go hydration sticks</span>
                </article>
                <article className="mega-highlight">
                  <img src="https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=700&q=80" alt="Stack and save products" />
                  <p>Stack & Save</p>
                  <span>Build complete systems</span>
                </article>
              </div>
            </li>
            <li><NavLink to={`/category/${toCategorySlug(scienceTarget)}`}>Science</NavLink></li>
            <li><NavLink to={`/category/${toCategorySlug(stackTarget)}`}>Stack</NavLink></li>
          </ul>

          <NavLink className="brand" to="/">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-text">FUSION</span>
          </NavLink>

          <div className="nav-utils">
            <div className="account-wrap">
              <button className="icon-btn currency-btn" aria-label="Currency" title={selectedCountry} onClick={() => setCurrencyOpen((prev) => !prev)}>
                <span>{selected.flag}</span>
                <span>{selected.currency}</span>
                <span className="nav-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
              {currencyOpen && (
                <div className="account-menu currency-menu">
                  {currencyOptions.map((entry) => (
                    <button
                      key={`${entry.country}-${entry.currency}`}
                      className="account-menu-btn currency-row"
                      onClick={() => {
                        onCurrencyChange(entry.currency, entry.country);
                        setCurrencyOpen(false);
                      }}
                    >
                      <span>{entry.flag}</span>
                      <span>{entry.country}</span>
                      <span>{entry.currency} {entry.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="icon-btn icon-only" aria-label="Search" onClick={onOpenSearch}>
              <span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M16 16l4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
            </button>
            <div className="account-wrap">
              <button className="icon-btn icon-only" aria-label="Account" onClick={onAccountClick}>
                <span className="nav-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8.3" r="3.4" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M5 19c1.2-3.2 4-4.8 7-4.8s5.8 1.6 7 4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
              {loggedIn && accountMenuOpen && (
                <div className="account-menu">
                  <NavLink className="account-menu-btn" to="/account">
                    My Account
                  </NavLink>
                  {isAdmin && (
                    <NavLink className="account-menu-btn" to="/admin">
                      Admin
                    </NavLink>
                  )}
                  <button className="account-menu-btn" onClick={onLogout}>
                    Log Out
                  </button>
                </div>
              )}
            </div>
            <button className="icon-btn icon-only cart-btn" aria-label="Cart" onClick={onOpenCart}>
              <span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M3.5 5.5h2.3l1.7 9.2h9.2l2-6.8H7.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="10" cy="19" r="1.2" fill="currentColor" />
                  <circle cx="17" cy="19" r="1.2" fill="currentColor" />
                </svg>
              </span>
              {cartCount > 0 && <b className="cart-count">{cartCount}</b>}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
