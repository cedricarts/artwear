import { useState, useEffect, useRef } from "react";
import { Link }                        from "react-router-dom";
import { useCart }                     from "../hooks/useCart";
import { useAuth }                     from "../hooks/useAuth";
import ThemeToggle                     from "./ThemeToggle";
import styles                          from "../styles/Navbar.module.css";

export default function Navbar() {
  const { itemCount }                    = useCart();
  const { currentUser, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen]          = useState(false);
  const navRef                           = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [menuOpen]);

  const handleLinkClick = () => setMenuOpen(false);
  const handleLogout = () => { setMenuOpen(false); logout(); };

  return (
    <nav className={styles.nav} ref={navRef}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand} onClick={handleLinkClick}>ARTWEAR</Link>

        <div className={styles.desktopLinks}>
          <Link to="/">Shop</Link>
          {isAdmin && <Link to="/admin">Admin</Link>}
          {currentUser && <Link to="/orders">Orders</Link>}
          {currentUser && <Link to="/wishlist">Wishlist</Link>}
          {currentUser && <Link to="/account">Account</Link>}
          <Link to="/custom-design">Custom</Link>
          <Link to="/cart" className={styles.cartLink}>
            Cart {itemCount > 0 && <span className={styles.cartBadge}>{itemCount}</span>}
          </Link>
          <ThemeToggle />
          {currentUser ? (
            <div className={styles.userArea}>
              {currentUser.photoURL && <img src={currentUser.photoURL} alt={currentUser.displayName ?? "User"} className={styles.avatar} referrerPolicy="no-referrer" />}
              <button onClick={logout} className={styles.authBtn}>Sign Out</button>
            </div>
          ) : (
            <Link to="/login" className={styles.authBtn}>Sign In</Link>
          )}
        </div>

        <div className={styles.mobileRight}>
          <ThemeToggle />
          <Link to="/cart" className={styles.mobileCartBtn} onClick={handleLinkClick} aria-label="Cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {itemCount > 0 && <span className={styles.cartBadge}>{itemCount}</span>}
          </Link>
          <button className={styles.hamburger} onClick={() => setMenuOpen((o) => !o)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>
            <span className={`${styles.bar} ${menuOpen ? styles.barTop : ""}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.barMid : ""}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.barBot : ""}`} />
          </button>
        </div>
      </div>

      <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ""}`}>
        <div className={styles.mobileMenuInner}>
          {currentUser && (
            <div className={styles.mobileUser}>
              {currentUser.photoURL && <img src={currentUser.photoURL} alt={currentUser.displayName ?? "User"} className={styles.mobileAvatar} referrerPolicy="no-referrer" />}
              <span className={styles.mobileUserName}>{currentUser.displayName ?? currentUser.email}</span>
            </div>
          )}
          <Link to="/" className={styles.mobileLink} onClick={handleLinkClick}>Shop</Link>
          <Link to="/custom-design" className={styles.mobileLink} onClick={handleLinkClick}>Custom Design</Link>
          {currentUser && <Link to="/orders" className={styles.mobileLink} onClick={handleLinkClick}>My Orders</Link>}
          {currentUser && <Link to="/wishlist" className={styles.mobileLink} onClick={handleLinkClick}>Wishlist</Link>}
          {currentUser && <Link to="/account" className={styles.mobileLink} onClick={handleLinkClick}>Account</Link>}
          <Link to="/cart" className={styles.mobileLink} onClick={handleLinkClick}>
            Cart {itemCount > 0 && <span className={styles.mobileBadge}>{itemCount}</span>}
          </Link>
          {isAdmin && <Link to="/admin" className={`${styles.mobileLink} ${styles.adminLink}`} onClick={handleLinkClick}>Admin Dashboard</Link>}
          <div className={styles.mobileDivider} />
          {currentUser ? (
            <button onClick={handleLogout} className={styles.mobileSignOut}>Sign Out</button>
          ) : (
            <Link to="/login" className={styles.mobileLink} onClick={handleLinkClick}>Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
