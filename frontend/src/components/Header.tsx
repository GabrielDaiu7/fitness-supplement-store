import { NavLink } from 'react-router-dom';

type HeaderProps = {
  cartCount: number;
  categories: string[];
  onOpenCart: () => void;
  onOpenSearch: () => void;
  onAccountClick: () => void;
  accountLabel: string;
  loggedIn: boolean;
  isAdmin?: boolean;
  onLogout: () => void;
  accountMenuOpen: boolean;
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
  accountLabel,
  loggedIn,
  isAdmin = false,
  onLogout,
  accountMenuOpen,
}: HeaderProps) {
  const navCategories = categories.filter((category) => category !== 'All');
  const shopTarget = navCategories[0] ?? 'Protein';
  const scienceTarget = navCategories[1] ?? shopTarget;
  const stackTarget = navCategories[2] ?? shopTarget;

  return (
    <>
      <header className="announce">
        <p>Free US Shipping Over $70</p>
      </header>

      <nav className="main-nav">
        <div className="shell nav-inner">
          <ul className="nav-links">
            <li className="nav-shop">
              <NavLink to={`/category/${toCategorySlug(shopTarget)}`}>Shop</NavLink>
              <div className="mega-menu">
                <article>
                  <h6>Category</h6>
                  {navCategories.slice(0, 8).map((category) => (
                    <NavLink key={category} to={`/category/${toCategorySlug(category)}`}>{category}</NavLink>
                  ))}
                </article>
                <article>
                  <h6>Goal</h6>
                  <NavLink to={`/category/${toCategorySlug(shopTarget)}`}>Build Muscle</NavLink>
                  <NavLink to={`/category/${toCategorySlug(scienceTarget)}`}>Athletic Performance</NavLink>
                  <NavLink to={`/category/${toCategorySlug(stackTarget)}`}>Weight Management</NavLink>
                  <NavLink to={`/category/${toCategorySlug(shopTarget)}`}>Health & Wellness</NavLink>
                </article>
                <article>
                  <h6>Best Sellers</h6>
                  <NavLink to={`/category/${toCategorySlug(shopTarget)}`}>Hydra Surge</NavLink>
                  <NavLink to={`/category/${toCategorySlug(scienceTarget)}`}>Pure Isolate</NavLink>
                  <NavLink to={`/category/${toCategorySlug(stackTarget)}`}>Ignite Pre</NavLink>
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
            <button className="icon-btn" aria-label="Currency">USD $</button>
            <button className="icon-btn" aria-label="Search" onClick={onOpenSearch}>SRCH</button>
            <div className="account-wrap">
              <button className="icon-btn" aria-label="Account" onClick={onAccountClick}>
                {accountLabel}
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
            <button className="icon-btn" aria-label="Cart" onClick={onOpenCart}>CART {cartCount}</button>
          </div>
        </div>
      </nav>
    </>
  );
}
