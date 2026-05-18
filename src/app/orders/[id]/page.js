'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import styles from './detail.module.css';

const STEPS = ['pending', 'preparing', 'ready', 'picked'];
const STEP_LABELS = { pending: 'Order Placed', preparing: 'Preparing', ready: 'Ready for Pickup', picked: 'Picked Up' };
const STEP_ICONS = { pending: '📝', preparing: '👨‍🍳', ready: '✅', picked: '🎉' };

export default function OrderDetailPage({ params }) {
  const { id } = use(params);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    const unsub = onSnapshot(doc(db, 'orders', id), (snap) => {
      if (snap.exists()) setOrder({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
    return () => unsub();
  }, [user, id, authLoading, router]);

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const currentStep = STEPS.indexOf(order?.status || 'pending');

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

  if (loading) return <div className={styles.page}><div className="container"><p className={styles.loading}>Loading order...</p></div></div>;
  if (!order) return <div className={styles.page}><div className="container"><p className={styles.loading}>Order not found</p></div></div>;

  return (
    <div className={styles.page}><div className="container">
      <div className="page-header">
        <h1>Order #{order.id.slice(-6).toUpperCase()}</h1>
        <p>{formatDate(order.createdAt)}</p>
      </div>

      <div className={`${styles.tracker} glass-card`}>
        <h2>Order Status</h2>
        <div className={styles.steps}>
          {STEPS.map((step, i) => (
            <div key={step} className={`${styles.step} ${i <= currentStep ? styles.stepDone : ''} ${i === currentStep ? styles.stepCurrent : ''}`}>
              <div className={styles.stepIcon}>{STEP_ICONS[step]}</div>
              <div className={styles.stepLine} />
              <span className={styles.stepLabel}>{STEP_LABELS[step]}</span>
            </div>
          ))}
        </div>
        {order.status === 'ready' && <div className={styles.readyBanner}>🎉 Your order is ready! Please pick it up from the counter.</div>}
      </div>

      <div className={styles.details}>
        <div className={`${styles.itemsCard} glass-card`}>
          <h2>Items Ordered</h2>
          {order.items?.map((item, i) => (
            <div key={i} className={styles.itemRow}>
              <span className={styles.itemEmoji}>{item.emoji || '🍽️'}</span>
              <span className={styles.itemName}>{item.name}</span>
              <span className={styles.itemQty}>×{item.quantity}</span>
              <span className={styles.itemPrice}>₹{item.price * item.quantity}</span>
            </div>
          ))}
          {order.specialInstructions && (
            <div className={styles.instructions}>
              <span className={styles.instructionsLabel}>💡 Your Custom Demands:</span>
              <span className={styles.instructionsText}>&quot;{order.specialInstructions}&quot;</span>
              <span className={styles.instructionsNote}>Sent as-is directly to the receiver for your satisfaction!</span>
            </div>
          )}
          <div className={styles.totalRow}><span>Total</span><span>₹{order.total}</span></div>
        </div>
      </div>
    </div></div>
  );
}
