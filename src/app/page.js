'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ToastContainer, useToast } from '@/components/Toast';
import styles from './page.module.css';
import loginStyles from './login/login.module.css';

const getWishesAndGreeting = () => {
  const hr = new Date().getHours();
  let greeting = "Good morning! ☀️";
  let wish = "Start your day with a delicious and fresh breakfast! Wishing you an energetic and wonderful day ahead! 🥞✨";
  if (hr >= 12 && hr < 17) {
    greeting = "Good afternoon! 🍛";
    wish = "Enjoy a wholesome, satisfying lunch to keep you going! Wishing you a super productive and happy afternoon! 🍱✨";
  } else if (hr >= 17 && hr < 21) {
    greeting = "Good evening! ☕";
    wish = "Time for a hot cup of tea and some crispy snacks! Wishing you a relaxing and peaceful evening! 🥟✨";
  } else if (hr >= 21 || hr < 4) {
    greeting = "Good night! 🌌";
    wish = "Grab a sweet dessert or a warm beverage before you wrap up! Wishing you sweet dreams and a restful night! 🍨✨";
  }
  return { greeting, wish };
};

export default function Home() {
  const { user, userData, loginWithPhone, logout, loading: authLoading } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const router = useRouter();

  // Login Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Handle auto-redirecting for admin and receiver to their respective dashboards
  useEffect(() => {
    if (!authLoading && user && userData) {
      if (userData.role === 'admin') {
        router.push('/admin');
      } else if (userData.role === 'receiver') {
        router.push('/receiver');
      }
    }
  }, [user, userData, authLoading, router]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    // Strict Indian mobile number validation starting with +91 followed by 10 digits
    const cleanPhone = phone.trim();
    const indianPhoneRegex = /^\+91[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanPhone)) {
      setLoginError('Please enter a valid Indian mobile number starting with +91 followed by 10 digits (starts with 6, 7, 8, or 9).');
      return;
    }

    setLoginLoading(true);
    try {
      await loginWithPhone(name, cleanPhone);
      addToast(`Welcome back, ${name}! Happy eating! ✨`, 'success');
    } catch (err) {
      setLoginError(err.message.includes('invalid') ? 'Invalid details provided' : err.message);
    }
    setLoginLoading(false);
  };

  const { greeting, wish } = getWishesAndGreeting();

  // Show premium loading spinner when checking auth persistence
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

  // 1. Not Logged In Layout: Welcome Wishes + Student Login below
  if (!user) {
    return (
      <div className={styles.hero} style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div className={styles.bgOrbs}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />
          <div className={styles.orb3} />
        </div>
        
        {/* Good Wishes & Greeting Card */}
        <div className="glass-card" style={{ maxWidth: '600px', width: '100%', padding: '32px', textAlign: 'center', marginBottom: '28px', border: '1px solid var(--accent-glow)', boxShadow: '0 8px 32px var(--accent-glow)' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>🍽️</span>
          <h1 className={styles.gradient} style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '12px' }}>{greeting}</h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: '1.6', fontWeight: 500 }}>
            {wish}
          </p>
        </div>

        {/* Student Login Form embedded directly below */}
        <div className={`${loginStyles.card} glass-card`} style={{ padding: '32px' }}>
          <div className={loginStyles.header} style={{ marginBottom: '24px' }}>
            <span className={loginStyles.icon}>👋</span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>Student Login</h2>
            <p>Enter your details to explore the menu and order</p>
          </div>
          
          {loginError && <div className={loginStyles.error}>{loginError}</div>}
          
          <form onSubmit={handleLoginSubmit} className={loginStyles.form}>
            <div className={loginStyles.field}>
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
            <div className={loginStyles.field}>
              <label>Mobile Number</label>
              <input 
                type="tel" 
                className="input-field" 
                placeholder="+91 9876543210" 
                value={phone} 
                onChange={(e) => {
                  const val = e.target.value;
                  let clean = val.replace(/[^\d+]/g, '');
                  if (!clean.startsWith('+91')) {
                    if (clean.startsWith('+9') || clean.startsWith('+') || clean.startsWith('91') || clean.startsWith('9')) {
                      clean = '+91';
                    } else {
                      clean = '+91' + clean.replace(/\D/g, '');
                    }
                  }
                  setPhone(clean.slice(0, 13));
                }} 
                pattern="\+91[6-9][0-9]{9}"
                title="Must be a valid Indian mobile number starting with +91 followed by 10 digits"
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loginLoading}>
              {loginLoading ? 'Opening CampusBite...' : 'Continue to Menu'}
            </button>
          </form>
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  // 2. Logged In: Student Dashboard / Second Interface
  return (
    <div className={styles.hero} style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className={styles.bgOrbs}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
      </div>

      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', zIndex: 2 }}>
        {/* Dynamic Good Wishes & Greeting Header for logged-in user */}
        <div className="page-header" style={{ marginBottom: '16px', textAlign: 'center' }}>
          <h1 className={styles.gradient} style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>
            {greeting.split('!')[0]}, {userData?.name || user?.email?.split('@')[0]}! ✨
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6', fontWeight: 500 }}>
            {wish}
          </p>
        </div>

        {/* 2x2 Student Dashboard Grid with exact 4 buttons: Menu, My Orders, Add to Cart (Cart), Logout */}
        <div className={styles.dashboardGrid}>
          {/* 1. Menu Button */}
          <div className={`${styles.dashboardCard} glass-card`} onClick={() => router.push('/menu')}>
            <span className={styles.dashboardCardIcon}>📖</span>
            <h3 className={styles.dashboardCardTitle}>Menu</h3>
            <p className={styles.dashboardCardDesc}>
              Explore our fresh, delicious dishes and place your order
            </p>
          </div>

          {/* 2. My Orders Button */}
          <div className={`${styles.dashboardCard} glass-card`} onClick={() => router.push('/orders')}>
            <span className={styles.dashboardCardIcon}>📦</span>
            <h3 className={styles.dashboardCardTitle}>My Orders</h3>
            <p className={styles.dashboardCardDesc}>
              Track your pending orders and pick them up when ready
            </p>
          </div>

          {/* 3. Add to Cart Button */}
          <div className={`${styles.dashboardCard} glass-card`} onClick={() => router.push('/cart')}>
            <span className={styles.dashboardCardIcon}>🛒</span>
            <h3 className={styles.dashboardCardTitle}>Add to Cart</h3>
            <p className={styles.dashboardCardDesc}>
              View items in your cart, add notes, and checkout quickly
            </p>
          </div>

          {/* 4. Logout Button */}
          <div className={`${styles.dashboardCard} glass-card`} onClick={async () => {
            await logout();
            addToast('Logged out successfully! See you soon! 👋', 'success');
          }}>
            <span className={styles.dashboardCardIcon}>🚪</span>
            <h3 className={styles.dashboardCardTitle}>Logout</h3>
            <p className={styles.dashboardCardDesc}>
              Securely exit your account session on this device
            </p>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
