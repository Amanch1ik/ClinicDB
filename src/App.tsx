import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import ProductCatalog from './components/Customer/ProductCatalog';
import CartPage from './components/Customer/CartPage';
import OrdersPage from './components/Customer/OrdersPage';
import ProfilePage from './components/Customer/ProfilePage';
import CourierDashboard from './components/Courier/CourierDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import Navigation from './components/Navigation';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentPage, setCurrentPage] = useState('catalog');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-800">Karakol Delivery</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    return authMode === 'login' ? (
      <LoginPage onSwitchToRegister={() => setAuthMode('register')} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  if (profile?.role === 'courier') {
    return <CourierDashboard />;
  }

  if (profile?.role === 'admin') {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentPage === 'catalog' && <ProductCatalog />}
      {currentPage === 'cart' && <CartPage />}
      {currentPage === 'orders' && <OrdersPage />}
      {currentPage === 'profile' && <ProfilePage />}

      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
