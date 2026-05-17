'use client';
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ToastContainer, useToast } from '@/components/Toast';
import styles from './menu.module.css';

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

export default function MenuPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToast();

  const fetchMenuItems = useCallback(async () => {
    try {
      const q = query(collection(db, 'menuItems'), orderBy('category'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setItems(data.length > 0 ? data : SAMPLE_ITEMS);
    } catch (err) {
      console.error('Error fetching menu:', err);
      setItems(SAMPLE_ITEMS);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMenuItems();
  }, [fetchMenuItems]);

  const filteredItems = items.filter((item) => {
    const matchCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchVeg = !vegOnly || item.veg;
    return matchCategory && matchSearch && matchVeg;
  });

  const handleAddToCart = (item) => {
    if (!user) { addToast('Please login to add items to cart', 'error'); return; }
    addToCart(item);
    addToast(`${item.name} added to cart!`, 'success');
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className="page-header">
          <h1>Our Menu</h1>
          <p>Fresh and delicious food made with love ❤️</p>
        </div>
        <div className={styles.filters}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input className={`input-field ${styles.searchInput}`} placeholder="Search dishes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <button className={`${styles.vegToggle} ${vegOnly ? styles.vegActive : ''}`} onClick={() => setVegOnly(!vegOnly)}>
            <span className={styles.vegDot} /> Veg Only
          </button>
        </div>
        <div className={styles.categories}>
          {CATEGORIES.map((cat) => (
            <button key={cat} className={`${styles.catBtn} ${activeCategory === cat ? styles.catActive : ''}`} onClick={() => setActiveCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>
        {loading ? (
          <div className={styles.grid}>{[...Array(8)].map((_, i) => <div key={i} className={`${styles.card} skeleton`} style={{ height: 280 }} />)}</div>
        ) : filteredItems.length === 0 ? (
          <div className={styles.empty}><span>😕</span><p>No items found</p></div>
        ) : (
          <div className={styles.grid}>
            {filteredItems.map((item, i) => (
              <div key={item.id} className={`${styles.card} glass-card`} style={{ animationDelay: `${i * 0.05}s` }}>
                <div className={styles.cardEmoji}>{item.emoji || '🍽️'}</div>
                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    <h3>{item.name}</h3>
                    <span className={item.veg ? styles.vegBadge : styles.nonvegBadge}>{item.veg ? '🟢' : '🔴'}</span>
                  </div>
                  <p className={styles.cardDesc}>{item.description}</p>
                  <div className={styles.cardBottom}>
                    <span className={styles.price}>₹{item.price}</span>
                    <button className="btn btn-primary btn-sm" onClick={() => handleAddToCart(item)} disabled={!item.available} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
