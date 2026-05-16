'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from '../login/login.module.css';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: 'yaminimali2007@gmail.com', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { registerReceiver } = useAuth();
  const router = useRouter();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await registerReceiver('yaminimali2007@gmail.com', form.password, form.name, form.phone);
      router.push('/receiver');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={`${styles.card} glass-card`}>
        <div className={styles.header}>
          <span className={styles.icon}>👨‍🍳</span>
          <h1>Receiver Access</h1>
          <p>Access the exclusive canteen receiver account (yaminimali2007)</p>
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
            <input name="phone" type="tel" className="input-field" placeholder="9876543210" value={form.phone} onChange={handleChange} required />
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
