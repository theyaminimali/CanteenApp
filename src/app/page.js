'use client';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.hero}>
      <div className={styles.bgOrbs}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
      </div>
      <div className={styles.content}>
        <div className={styles.badge}>🎓 College Canteen App</div>
        <h1 className={styles.title}>
          Skip The Line,<br />
          <span className={styles.gradient}>Order Online</span>
        </h1>
        <p className={styles.subtitle}>
          Browse the menu, place your order, and pick it up when it&apos;s ready. No more waiting in long queues.
        </p>
        <div className={styles.actions}>
          <Link href="/menu" className="btn btn-primary btn-lg">Explore Menu →</Link>
          <Link href="/login" className="btn btn-secondary btn-lg">Start Ordering</Link>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}><span className={styles.statNum}>50+</span><span className={styles.statLabel}>Menu Items</span></div>
          <div className={styles.stat}><span className={styles.statNum}>500+</span><span className={styles.statLabel}>Orders Daily</span></div>
          <div className={styles.stat}><span className={styles.statNum}>4.8★</span><span className={styles.statLabel}>Rating</span></div>
        </div>
      </div>
      <div className={styles.cards}>
        <div className={`${styles.featureCard} glass-card`}>
          <span className={styles.featureIcon}>📋</span>
          <h3>Browse Menu</h3>
          <p>Explore our wide range of delicious food items with categories and filters</p>
        </div>
        <div className={`${styles.featureCard} glass-card`}>
          <span className={styles.featureIcon}>🛒</span>
          <h3>Quick Order</h3>
          <p>Add items to cart and place your order in seconds with special instructions</p>
        </div>
        <div className={`${styles.featureCard} glass-card`}>
          <span className={styles.featureIcon}>📡</span>
          <h3>Live Tracking</h3>
          <p>Track your order status in real-time from preparation to ready for pickup</p>
        </div>
      </div>
    </div>
  );
}
