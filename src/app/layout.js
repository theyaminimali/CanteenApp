import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'CampusBite - College Canteen Ordering',
  description: 'Order food from your college canteen. Browse menu, place orders, and track them in real-time.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main style={{ minHeight: 'calc(100vh - 70px)' }}>{children}</main>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
