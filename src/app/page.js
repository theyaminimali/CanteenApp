'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { ToastContainer, useToast } from '@/components/Toast';
import styles from './page.module.css';
import menuStyles from './menu/menu.module.css';
import loginStyles from './login/login.module.css';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Snacks', 'Beverages', 'Desserts'];

const SAMPLE_ITEMS = [
  { id: '1', name: 'Masala Dosa', description: 'Crispy dosa with potato filling, served with chutney & sambar', price: 50, category: 'Breakfast', veg: true, emoji: '🥞', available: true },
  { id: '2', name: 'Idli Sambar', description: 'Soft steamed idli with hot sambar and coconut chutney', price: 35, category: 'Breakfast', veg: true, emoji: '🍚', available: true },
  { id: '3', name: 'Poha', description: 'Flattened rice with peanuts, curry leaves & lemon', price: 30, category: 'Breakfast', veg: true, emoji: '🍛', available: true },
  { id: '4', name: 'Veg Thali', description: 'Complete meal with dal, sabzi, roti, rice, salad & sweet', price: 80, category: 'Lunch', veg: true, emoji: '🍱', available: true },
  { id: '5', name: 'Chicken Biryani', description: 'Aromatic basmati rice with tender chicken and spices', price: 120, category: 'Lunch', veg: false, emoji: '🍗', available: true },
  { id: '6', name: 'Paneer Butter Masala', description: 'Rich creamy gravy with soft paneer cubes, served with naan', price: 100, category: 'Lunch', veg: true, emoji: '🧈', available: true },
  { id: '7', name: 'Rajma Chawal', description: 'Kidney beans curry with steamed basmati rice', price: 70, category: 'Lunch', veg: true, emoji: '🫘', available: true },
  { id: '8', name: 'Samosa', description: 'Crispy pastry filled with spiced potatoes and peas', price: 15, category: 'Snacks', veg: true, emoji: '🥟', available: true },
  { id: '9', name: 'Vada Pav', description: 'Mumbai style spicy potato fritter in a bun', price: 20, category: 'Snacks', veg: true, emoji: '🍔', available: true },
  { id: '10', name: 'French Fries', description: 'Crispy golden fries with seasoning', price: 40, category: 'Snacks', veg: true, emoji: '🍟', available: true },
  { id: '11', name: 'Chicken Roll', description: 'Grilled chicken wrapped in rumali roti with mint chutney', price: 60, category: 'Snacks', veg: false, emoji: '🌯', available: true },
  { id: '12', name: 'Chai', description: 'Hot Indian tea with ginger and cardamom', price: 15, category: 'Beverages', veg: true, emoji: '☕', available: true },
  { id: '13', name: 'Cold Coffee', description: 'Chilled coffee blended with ice cream', price: 50, category: 'Beverages', veg: true, emoji: '🧋', available: true },
  { id: '14', name: 'Mango Lassi', description: 'Thick yogurt smoothie with fresh mango pulp', price: 45, category: 'Beverages', veg: true, emoji: '🥭', available: true },
  { id: '15', name: 'Gulab Jamun', description: 'Soft milk dumplings in warm sugar syrup', price: 30, category: 'Desserts', veg: true, emoji: '🍩', available: true },
  { id: '16', name: 'Ice Cream', description: 'Choice of vanilla, chocolate or butterscotch', price: 40, category: 'Desserts', veg: true, emoji: '🍨', available: true },
];

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
  const { user, userData, loginWithPhone, loading: authLoading } = useAuth();
  const { addToCart } = useCart();
  const { toasts, addToast, removeToast } = useToast();
  const router = useRouter();

  // Login Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Menu States
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  const fetchMenuItems = useCallback(async () => {
    try {
      const q = query(collection(db, 'menuItems'), orderBy('category'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMenuItems(data.length > 0 ? data : SAMPLE_ITEMS);
    } catch (err) {
      console.error('Error fetching menu:', err);
      setMenuItems(SAMPLE_ITEMS);
    }
    setMenuLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchMenuItems();
    }
  }, [user, fetchMenuItems]);

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

  const handleAddToCart = (item) => {
    addToCart(item);
    addToast(`${item.name} added to cart! 🛒`, 'success');
  };

  const filteredItems = menuItems.filter((item) => {
    const matchCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchVeg = !vegOnly || item.veg;
    return matchCategory && matchSearch && matchVeg;
  });

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

  // 1. Not Logged In Layout
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

  // 2. Logged In: Open Menu Card in a Good Manner
  return (
    <div className={menuStyles.page}>
      <div className="container">
        {/* Dynamic Good Wishes & Greeting Header for logged-in user */}
        <div className="page-header" style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 className={styles.gradient} style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>
            {greeting.split('!')[0]}, {userData?.name || 'Student'}! ✨
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6', fontWeight: 500 }}>
            {wish}
          </p>
        </div>

        {/* Menu Search and Toggles */}
        <div className={menuStyles.filters}>
          <div className={menuStyles.searchWrap}>
            <span className={menuStyles.searchIcon}>🔍</span>
            <input 
              className={`input-field ${menuStyles.searchInput}`} 
              placeholder="Search dishes..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          <button 
            className={`${menuStyles.vegToggle} ${vegOnly ? menuStyles.vegActive : ''}`} 
            onClick={() => setVegOnly(!vegOnly)}
          >
            <span className={menuStyles.vegDot} /> Veg Only
          </button>
        </div>

        {/* Categories Selection */}
        <div className={menuStyles.categories}>
          {CATEGORIES.map((cat) => (
            <button 
              key={cat} 
              className={`${menuStyles.catBtn} ${activeCategory === cat ? menuStyles.catActive : ''}`} 
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid of Dishes with direct Add to Cart buttons */}
        {menuLoading ? (
          <div className={menuStyles.grid}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`${menuStyles.card} skeleton`} style={{ height: 280 }} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className={menuStyles.empty}>
            <span>😕</span>
            <p>No items found matching your filters.</p>
          </div>
        ) : (
          <div className={menuStyles.grid}>
            {filteredItems.map((item, i) => (
              <div key={item.id} className={`${menuStyles.card} glass-card`} style={{ animationDelay: `${i * 0.05}s` }}>
                <div className={menuStyles.cardEmoji}>{item.emoji || '🍽️'}</div>
                <div className={menuStyles.cardBody}>
                  <div className={menuStyles.cardTop}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{item.name}</h3>
                    <span className={item.veg ? menuStyles.vegBadge : menuStyles.nonvegBadge}>
                      {item.veg ? '🟢' : '🔴'}
                    </span>
                  </div>
                  <p className={menuStyles.cardDesc}>{item.description}</p>
                  <div className={menuStyles.cardBottom}>
                    <span className={menuStyles.price}>₹{item.price}</span>
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={() => handleAddToCart(item)} 
                      disabled={!item.available}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {item.available ? '🛒 Add to Cart' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
