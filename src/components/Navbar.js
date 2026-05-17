'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { ToastContainer, useToast } from '@/components/Toast';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, userData, logout } = useAuth();
  const { cartCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const notifiedOrders = useRef(new Set());
  const isFirstRun = useRef(true);

  const handleLogout = async () => {
    try { await logout(); } catch (e) { console.error(e); }
  };

  // Request browser notification permissions and register Service Worker on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Request native Notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(err => console.error("Notification permission request failed:", err));
      }

      // Register PWA Service Worker for home-screen installability
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
          .catch((err) => console.error('Service Worker registration failed:', err));
      }
    }
  }, []);

  useEffect(() => {
    if (!user) {
      notifiedOrders.current.clear();
      isFirstRun.current = true;
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      where('status', '==', 'ready')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (isFirstRun.current) {
        isFirstRun.current = false;
        // Mark all currently ready orders as "already notified" so we don't alert for them on page load
        const initialIds = snapshot.docs.map(doc => doc.id);
        notifiedOrders.current = new Set(initialIds);
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const orderId = change.doc.id;
          const orderData = change.doc.data();

          if (orderData.status === 'ready' && !notifiedOrders.current.has(orderId)) {
            notifiedOrders.current.add(orderId);
            
            // Play notification sound (heavy classic doorbell sound)
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.preload = 'auto';
              audio.volume = 1.0; // Play at maximum volume for maximum audibility
              audio.play().catch(err => console.warn('Audio playback failed or blocked by browser:', err));
            } catch (e) {
              console.error("Audio playback error:", e);
            }

            // Show custom ready toast notification
            addToast('Your Order is ready now please pickup it', 'success');

            // Trigger native device/system push notification (works when screen is locked/app is backgrounded)
            if (typeof window !== 'undefined' && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification('Order Ready!', {
                  body: 'Your Order is ready now please pickup it',
                  icon: 'https://cdn-icons-png.flaticon.com/512/1046/1046747.png', // Premium food icon
                  tag: orderId,
                  requireInteraction: true
                });
              } else if (Notification.permission === 'default') {
                Notification.requestPermission().then((permission) => {
                  if (permission === 'granted') {
                    new Notification('Order Ready!', {
                      body: 'Your Order is ready now please pickup it',
                      icon: 'https://cdn-icons-png.flaticon.com/512/1046/1046747.png',
                      tag: orderId,
                      requireInteraction: true
                    });
                  }
                });
              }
            }
          }
        }
      });
    }, (err) => {
      console.error("Order notification listener error:", err);
    });

    return () => unsub();
  }, [user, addToast]);

  return (
    <>
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
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}
