import { NavLink } from 'react-router-dom';

type HeaderProps = {
  cartCount: number;
  categories: string[];
  onOpenCart: () => void;
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
            <li><NavLink to={`/category/${toCategorySlug(shopTarget)}`}>Shop</NavLink></li>
            <li><NavLink to={`/category/${toCategorySlug(scienceTarget)}`}>Science</NavLink></li>
            <li><NavLink to={`/category/${toCategorySlug(stackTarget)}`}>Stack</NavLink></li>
          </ul>

          <NavLink className="brand" to="/">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-text">FUSION</span>
          </NavLink>

          <div className="nav-utils">
            <span>USD $</span>
            <button className="icon-btn" aria-label="Search">SRCH</button>
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
