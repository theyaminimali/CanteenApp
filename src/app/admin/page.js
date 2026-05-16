'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { ToastContainer, useToast } from '@/components/Toast';
import styles from './admin.module.css';

const STATUS_OPTIONS = ['pending', 'preparing', 'ready', 'picked'];
const STATUS_COLORS = { pending: 'warning', preparing: 'info', ready: 'success', picked: 'secondary' };

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, userData } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (userData && userData.role !== 'admin') { router.push('/'); return; }

    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [user, userData, router]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      addToast(`Order updated to ${newStatus}`, 'success');
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

  if (loading) return <div className="container"><p className={styles.loading}>Loading dashboard...</p></div>;

  return (
    <div className={styles.page}><div className="container">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Manage all canteen orders</p>
      </div>
      
      <div className={styles.stats}>
        <div className={`${styles.statCard} glass-card`}>
          <h3>Pending</h3>
          <span>{orders.filter(o => o.status === 'pending').length}</span>
        </div>
        <div className={`${styles.statCard} glass-card`}>
          <h3>Preparing</h3>
          <span>{orders.filter(o => o.status === 'preparing').length}</span>
        </div>
        <div className={`${styles.statCard} glass-card`}>
          <h3>Ready</h3>
          <span>{orders.filter(o => o.status === 'ready').length}</span>
        </div>
      </div>

      <div className={`${styles.ordersTable} glass-card`}>
        <h2>Live Orders</h2>
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Time</th>
                <th>Student</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td><span className={styles.id}>#{order.id.slice(-6).toUpperCase()}</span></td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <div>{order.userName}</div>
                    <div className={styles.subtext}>{order.userRegNumber} • {order.userPhone}</div>
                  </td>
                  <td>
                    <div className={styles.itemsList}>
                      {order.items?.map((it, i) => (
                        <span key={i}>{it.quantity}x {it.name}</span>
                      ))}
                    </div>
                  </td>
                  <td>₹{order.total}</td>
                  <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                  <td>
                    <select 
                      className={styles.statusSelect}
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan="7" className={styles.emptyTable}>No orders yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
