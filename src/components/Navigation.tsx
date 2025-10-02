import { Home, ShoppingCart, Package, User as UserIcon } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { totalItems } = useCart();

  const navItems = [
    { id: 'catalog', icon: Home, label: 'Asosiy' },
    { id: 'cart', icon: ShoppingCart, label: 'Savat', badge: totalItems },
    { id: 'orders', icon: Package, label: 'Buyurtmalar' },
    { id: 'profile', icon: UserIcon, label: 'Profil' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition relative ${
                isActive ? 'text-orange-500' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="relative">
                <Icon size={24} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
