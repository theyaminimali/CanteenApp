'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function TestOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchOrders();
  }, []);

  if (loading) return <div>Loading database orders...</div>;

  return (
    <div style={{ padding: '40px', background: '#0a0a0f', color: '#fff', minHeight: '100vh', fontFamily: 'monospace' }}>
      <h1>Database Orders Diagnostic Inspector</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
        {orders.map(o => (
          <div key={o.id} style={{ border: '1px solid #333', padding: '20px', borderRadius: '8px', background: '#12121a' }}>
            <h3>Order ID: {o.id}</h3>
            <p><strong>Status:</strong> {o.status}</p>
            <p><strong>User:</strong> {o.userName} ({o.userPhone})</p>
            <p><strong>Items:</strong> {JSON.stringify(o.items)}</p>
            <p style={{ color: o.specialInstructions ? '#fbbf24' : '#666' }}>
              <strong>specialInstructions:</strong> {o.specialInstructions !== undefined ? `"${o.specialInstructions}"` : 'UNDEFINED'}
            </p>
            <p style={{ fontSize: '0.8rem', color: '#555' }}><strong>Raw Doc Data:</strong> {JSON.stringify(o)}</p>
          </div>
        ))}
        {orders.length === 0 && <p>No orders found in Firestore</p>}
      </div>
    </div>
  );
}
