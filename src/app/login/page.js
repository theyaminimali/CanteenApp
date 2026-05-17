'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './login.module.css';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithPhone, user, userData, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (userData?.role === 'admin') {
        router.push('/admin');
      } else if (userData?.role === 'receiver') {
        router.push('/receiver');
      } else {
        router.push('/');
      }
    }
  }, [user, userData, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Strict Indian mobile number validation starting with +91 followed by 10 digits (6-9)
    const cleanPhone = phone.trim();
    const indianPhoneRegex = /^\+91[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanPhone)) {
      setError('Please enter a valid Indian mobile number starting with +91 followed by 10 digits (starts with 6, 7, 8, or 9).');
      return;
    }

    setLoading(true);
    try {
      await loginWithPhone(name, cleanPhone);
      router.push('/');
    } catch (err) {
      setError(err.message.includes('invalid') ? 'Invalid details provided' : err.message);
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
          <span className={styles.icon}>👋</span>
          <h1>Welcome</h1>
          <p>Enter your details to continue</p>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter your name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>
          <div className={styles.field}>
            <label>Mobile Number</label>
            <input 
              type="tel" 
              className="input-field" 
              placeholder="+91 9876543210" 
              value={phone} 
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
                setPhone(clean.slice(0, 13));
              }} 
              pattern="\+91[6-9][0-9]{9}"
              title="Must be a valid Indian mobile number starting with +91 followed by 10 digits (starts with 6, 7, 8, or 9)"
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Continuing...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
