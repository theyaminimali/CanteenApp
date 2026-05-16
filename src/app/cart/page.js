'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ToastContainer, useToast } from '@/components/Toast';
import styles from './cart.module.css';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal, specialInstructions, setSpecialInstructions } = useCart();
  const { user, userData } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [placing, setPlacing] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const router = useRouter();

  const handlePlaceOrder = async () => {
    if (!user) { addToast('Please login first', 'error'); return; }
    if (cartItems.length === 0) return;
    setPlacing(true);

    try {
      // Create the order document for Firestore
      const orderData = {
        userId: user.uid,
        userName: userData?.name || 'Student',
        userPhone: userData?.phone || 'N/A',
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total: cartTotal,
        specialInstructions: specialInstructions || '',
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'orders'), orderData);

      // Play door bell sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play();
      } catch (e) {
        console.error("Audio playback failed", e);
      }

      // Clear cart
      clearCart();
      setShowSuccessDialog(true);

    } catch (err) {
      console.error('Order error:', err);
      addToast('Failed to place order. Try again.', 'error');
    }
    setPlacing(false);
  };

  if (cartItems.length === 0) {
    return (
      <div className={styles.page}><div className="container">
        <div className={styles.empty}>
          <span>🛒</span><h2>Your cart is empty</h2>
          <p>Add some delicious items from the menu</p>
          <Link href="/menu" className="btn btn-primary">Browse Menu</Link>
        </div>
      </div></div>
    );
  }

  return (
    <div className={styles.page}><div className="container">
      <div className="page-header"><h1>Your Cart</h1><p>{cartItems.length} item{cartItems.length > 1 ? 's' : ''} in cart</p></div>
      <div className={styles.layout}>
        <div className={styles.itemsList}>
          {cartItems.map((item) => (
            <div key={item.id} className={`${styles.item} glass-card`}>
              <div className={styles.itemEmoji}>{item.emoji || '🍽️'}</div>
              <div className={styles.itemInfo}>
                <h3>{item.name}</h3>
                <p className={styles.itemPrice}>₹{item.price} each</p>
              </div>
              <div className={styles.qty}>
                <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                <span className={styles.qtyNum}>{item.quantity}</span>
                <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
              </div>
              <div className={styles.itemTotal}>₹{item.price * item.quantity}</div>
              <button className={styles.removeBtn} onClick={() => removeFromCart(item.id)}>✕</button>
            </div>
          ))}
        </div>
        <div className={`${styles.summary} glass-card`}>
          <h2>Order Summary</h2>
          <div className={styles.summaryRows}>
            {cartItems.map((i) => (
              <div key={i.id} className={styles.summaryRow}>
                <span>{i.name} × {i.quantity}</span><span>₹{i.price * i.quantity}</span>
              </div>
            ))}
          </div>
          <div className={styles.field}>
            <label>Special Instructions</label>
            <textarea className="input-field" rows={3} placeholder="Any special requests..." value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} />
          </div>
          <div className={styles.totalRow}><span>Total</span><span className={styles.totalAmt}>₹{cartTotal}</span></div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handlePlaceOrder} disabled={placing}>
            {placing ? 'Placing Order...' : `Place Order • ₹${cartTotal}`}
          </button>
        </div>
      </div>
    </div>
      {showSuccessDialog && (
        <div className={styles.dialogOverlay}>
          <div className={`${styles.dialogBox} glass-card`}>
            <span className={styles.dialogIcon}>🎉</span>
            <h2>Success!</h2>
            <p>{userData?.name} Your Order paced</p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => router.push('/')}>
              Continue
            </button>
          </div>
        </div>
      )}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
