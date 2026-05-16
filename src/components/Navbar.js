'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, userData, logout } = useAuth();
  const { cartCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try { await logout(); } catch (e) { console.error(e); }
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🍽️</span>
          <span className={styles.logoText}>CampusBite</span>
        </Link>

        <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
          <span className={`${styles.bar} ${menuOpen ? styles.barOpen : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barOpen : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barOpen : ''}`} />
        </button>

        <div className={`${styles.links} ${menuOpen ? styles.linksOpen : ''}`}>
          <Link href="/menu" className={styles.link} onClick={() => setMenuOpen(false)}>Menu</Link>
          {user ? (
            <>
              <Link href="/orders" className={styles.link} onClick={() => setMenuOpen(false)}>My Orders</Link>
              <Link href="/cart" className={styles.cartLink} onClick={() => setMenuOpen(false)}>
                🛒
                {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
              </Link>
              {userData?.role === 'admin' && (
                <Link href="/admin" className={styles.link} onClick={() => setMenuOpen(false)}>Admin</Link>
              )}
              {userData?.role === 'receiver' && (
                <Link href="/receiver" className={styles.link} onClick={() => setMenuOpen(false)}>Receiver</Link>
              )}
              <div className={styles.userSection}>
                <Link href="/profile" className={styles.avatar} onClick={() => setMenuOpen(false)}>
                  {userData?.name?.charAt(0)?.toUpperCase() || '?'}
                </Link>
                <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
              </div>
            </>
          ) : (
            <div className={styles.authLinks}>
              <Link href="/login" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>Student Login</Link>
              <Link href="/register" className={styles.receiverLink} onClick={() => setMenuOpen(false)}>Receiver Station</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
