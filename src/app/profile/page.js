'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ToastContainer, useToast } from '@/components/Toast';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { user, userData, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (userData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ name: userData.name || '', phone: userData.phone || '' });
    }
  }, [user, userData, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: form.name,
        phone: form.phone
      });
      addToast('Profile updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to update profile', 'error');
    }
    setLoading(false);
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

  if (!userData) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className={styles.page}><div className="container">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your account details</p>
      </div>
      <div className={styles.content}>
        <div className={`${styles.card} glass-card`}>
          <div className={styles.avatar}>
            {form.name.charAt(0).toUpperCase()}
          </div>
          <div className={styles.info}>
            <p className={styles.email}>{user.email}</p>
            <p className={styles.role}>Role: {userData.role} • Reg No: {userData.regNumber}</p>
          </div>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Full Name</label>
              <input type="text" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className={styles.field}>
              <label>Phone Number</label>
              <input type="tel" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
    <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
