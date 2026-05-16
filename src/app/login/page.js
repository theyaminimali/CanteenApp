'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './login.module.css';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithPhone } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithPhone(name, phone);
      router.push('/menu');
    } catch (err) {
      setError(err.message.includes('invalid') ? 'Invalid details provided' : err.message);
    }
    setLoading(false);
  };

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
            <input type="text" className="input-field" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label>Mobile Number</label>
            <input type="tel" className="input-field" placeholder="Enter your mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Continuing...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
