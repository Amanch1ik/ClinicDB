import { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { formatPrice } from '../../lib/utils';
import CheckoutModal from './CheckoutModal';

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalAmount, totalItems } = useCart();
  const { profile } = useAuth();
  const [showCheckout, setShowCheckout] = useState(false);

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingBag size={64} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Savat bo'sh</h2>
          <p className="text-gray-600">Mahsulotlar qo'shing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white sticky top-0 z-10 shadow-sm px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-800">Savat</h1>
      </div>

      <div className="p-4 space-y-4">
        {items.map(item => (
          <div key={item.product.id} className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex gap-4">
              <div
                className="w-24 h-24 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-lg"
                style={{ backgroundColor: item.product.color }}
              >
                {item.product.name.slice(0, 3)}
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-gray-800 mb-1">
                  {item.product.name_ru || item.product.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {formatPrice(item.product.price)} so'm
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center bg-gray-100 rounded-full">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-2 hover:bg-gray-200 rounded-full transition"
                    >
                      <Minus size={16} className="text-gray-700" />
                    </button>
                    <span className="px-4 font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-2 hover:bg-gray-200 rounded-full transition"
                    >
                      <Plus size={16} className="text-gray-700" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-lg text-orange-600">
                  {formatPrice(item.product.price * item.quantity)} so'm
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Jami:</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatPrice(totalAmount)} so'm
              </p>
            </div>

            <button
              onClick={() => setShowCheckout(true)}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-full font-semibold hover:from-orange-600 hover:to-red-600 transition"
            >
              Buyurtma berish
            </button>
          </div>
        </div>
      </div>

      {showCheckout && (
        <CheckoutModal
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}
