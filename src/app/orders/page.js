'use client';
import { useState, useEffect } from 'react';
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
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
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
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

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
