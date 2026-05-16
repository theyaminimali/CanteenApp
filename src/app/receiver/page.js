'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { ToastContainer, useToast } from '@/components/Toast';
import styles from './receiver.module.css';

export default function ReceiverDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, userData } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const router = useRouter();

  const lastOrderCount = useRef(0);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (userData && userData.role !== 'receiver') { router.push('/'); return; }

    // Fetch orders, ordered by time
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filter out 'picked' orders in memory to avoid Firestore composite index requirements
      const activeOrders = allOrders.filter(o => o.status !== 'picked');
      
      // Play door bell sound if a new order is received
      if (!isFirstLoad.current && activeOrders.length > lastOrderCount.current) {
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play();
        } catch (e) {
          console.error("Audio playback failed", e);
        }
      }

      setOrders(activeOrders);
      lastOrderCount.current = activeOrders.length;
      isFirstLoad.current = false;
      setLoading(false);
    });

    return () => unsub();
  }, [user, userData, router]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      addToast(`Order moved to ${newStatus}`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to update status', 'error');
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className={styles.loading}>Loading Receiver Station...</div>;

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  const renderOrderCard = (order) => (
    <div key={order.id} className={`${styles.orderCard} ${styles[order.status]}`}>
      <div className={styles.cardHeader}>
        <span className={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</span>
        <span className={styles.orderTime}>{formatDate(order.createdAt)}</span>
      </div>
      
      <div className={styles.studentInfo}>
        <div className={styles.studentName}>{order.userName}</div>
        <div className={styles.studentDetails}>{order.userPhone}</div>
      </div>

      <div className={styles.itemsList}>
        {order.items?.map((it, i) => (
          <div key={i} className={styles.itemRow}>
            <span><span className={styles.itemQty}>{it.quantity}x</span> {it.name}</span>
          </div>
        ))}
      </div>

      <div className={styles.cardActions}>
        {order.status === 'pending' && (
          <button className={styles.acceptBtn} onClick={() => updateStatus(order.id, 'preparing')}>
            Accept & Prepare
          </button>
        )}
        {order.status === 'preparing' && (
          <button className={styles.readyBtn} onClick={() => updateStatus(order.id, 'ready')}>
            Mark as Ready
          </button>
        )}
        {order.status === 'ready' && (
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => updateStatus(order.id, 'picked')}>
            Handed Over
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.kdsPage}>
      <div className={styles.kdsHeader}>
        <h1><span className={styles.pulseIndicator}></span> Live Order Receiver Station</h1>
        <div className="badge badge-pending" style={{ fontSize: '1rem', padding: '8px 16px' }}>
          Exclusive Receiver Account
        </div>
      </div>

      <div className={styles.board}>
        {/* NEW ORDERS */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <span>New Orders (Pending)</span>
            <span className={styles.columnCount}>{pendingOrders.length}</span>
          </div>
          {pendingOrders.length === 0 ? (
            <div className={styles.emptyState}>No new orders</div>
          ) : (
            pendingOrders.map(renderOrderCard)
          )}
        </div>

        {/* PREPARING */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <span>In Kitchen (Preparing)</span>
            <span className={styles.columnCount}>{preparingOrders.length}</span>
          </div>
          {preparingOrders.length === 0 ? (
            <div className={styles.emptyState}>No orders being prepared</div>
          ) : (
            preparingOrders.map(renderOrderCard)
          )}
        </div>

        {/* READY FOR PICKUP */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <span>Ready for Pickup</span>
            <span className={styles.columnCount}>{readyOrders.length}</span>
          </div>
          {readyOrders.length === 0 ? (
            <div className={styles.emptyState}>No orders waiting for pickup</div>
          ) : (
            readyOrders.map(renderOrderCard)
          )}
        </div>
      </div>
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
