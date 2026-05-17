'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import styles from './orders.module.css';

const STATUS_LABELS = { pending: 'Pending', preparing: 'Preparing', ready: 'Ready', picked: 'Picked Up' };

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const fetchedOrders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      // Sort in-memory to avoid requiring a composite index
      fetchedOrders.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA; // descending
      });

      setOrders(fetchedOrders);
    } catch (err) { console.error('Error:', err); }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [user, authLoading, router, fetchOrders]);

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 70px)', gap: '16px' }}>
        <svg width="40" height="40" viewBox="0 0 50 50" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="25" cy="25" r="20" fill="none" stroke="var(--accent)" strokeWidth="4" strokeDasharray="80 200" strokeLinecap="round" />
        </svg>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>Securing connection...</p>
      </div>
    );
  }

  if (loading) return <div className={styles.page}><div className="container"><div className={styles.loading}>Loading orders...</div></div></div>;

  return (
    <div className={styles.page}><div className="container">
      <div className="page-header"><h1>My Orders</h1><p>Track and view your order history</p></div>
      {orders.length === 0 ? (
        <div className={styles.empty}><span>📦</span><h2>No orders yet</h2><p>Place your first order from the menu</p><Link href="/menu" className="btn btn-primary">Browse Menu</Link></div>
      ) : (
        <div className={styles.list}>
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className={`${styles.orderCard} glass-card`}>
              <div className={styles.orderTop}>
                <div>
                  <span className={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</span>
                  <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                </div>
                <span className={`badge badge-${order.status}`}>{STATUS_LABELS[order.status] || order.status}</span>
              </div>
              <div className={styles.orderItems}>
                {order.items?.map((it, i) => (
                  <span key={i} className={styles.orderItem}>{it.emoji} {it.name} ×{it.quantity}</span>
                ))}
              </div>
              <div className={styles.orderBottom}>
                <span className={styles.orderTotal}>₹{order.total}</span>
                <span className={styles.viewBtn}>View Details →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div></div>
  );
}
