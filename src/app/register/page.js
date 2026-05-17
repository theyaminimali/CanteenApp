'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from '../login/login.module.css';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: 'yaminimali2007@gmail.com', password: '', phone: '+91' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { registerReceiver, user, userData, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in as receiver
  useEffect(() => {
    if (!authLoading && user && userData?.role === 'receiver') {
      router.push('/receiver');
    }
  }, [user, userData, authLoading, router]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Strict Indian mobile number validation starting with +91 followed by 10 digits (6-9)
    const cleanPhone = form.phone.trim();
    const indianPhoneRegex = /^\+91[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanPhone)) {
      setError('Please enter a valid Indian mobile number starting with +91 followed by 10 digits (starts with 6, 7, 8, or 9).');
      return;
    }

    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await registerReceiver('yaminimali2007@gmail.com', form.password, form.name, cleanPhone);
      router.push('/receiver');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Prevent UI flash by showing loader when checking auth persistence
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

  return (
    <div className={styles.page}>
      <div className={`${styles.card} glass-card`}>
        <div className={styles.header}>
          <span className={styles.icon}>👨‍🍳</span>
          <h1>Receiver Access</h1>
          <p>Access the exclusive canteen receiver account</p>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Full Name</label>
            <input name="name" className="input-field" placeholder="Canteen Manager" value={form.name} onChange={handleChange} required />
          </div>
          <div className={styles.field}>
            <label>Email</label>
            <input name="email" type="email" className="input-field" value="yaminimali2007@gmail.com" readOnly required />
          </div>
          <div className={styles.field}>
            <label>Phone</label>
            <input 
              name="phone" 
              type="tel" 
              className="input-field" 
              placeholder="+91 9876543210" 
              value={form.phone} 
              onChange={(e) => {
                const val = e.target.value;
                // Keep only digits and plus sign
                let clean = val.replace(/[^\d+]/g, '');
                
                // Ensure it starts with +91
                if (!clean.startsWith('+91')) {
                  if (clean.startsWith('+9') || clean.startsWith('+') || clean.startsWith('91') || clean.startsWith('9')) {
                    clean = '+91';
                  } else {
                    clean = '+91' + clean.replace(/\D/g, '');
                  }
                }
                
                // Limit to +91 + 10 digits = 13 characters total
                setForm({ ...form, phone: clean.slice(0, 13) });
              }} 
              pattern="\+91[6-9][0-9]{9}"
              title="Must be a valid Indian mobile number starting with +91 followed by 10 digits (starts with 6, 7, 8, or 9)"
              required 
            />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input name="password" type="password" className="input-field" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Accessing...' : 'Access Receiver Station'}
          </button>
        </form>
        <p className={styles.footer}>
          Already registered? <Link href="/login" className={styles.link}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
