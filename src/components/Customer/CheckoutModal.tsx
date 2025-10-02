import { useState } from 'react';
import { X, MapPin, CreditCard, Wallet } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/utils';

interface CheckoutModalProps {
  onClose: () => void;
}

const paymentMethods = [
  { id: 'cash', name: 'Naqd pul', icon: '💵' },
  { id: 'mbank', name: 'MBank', icon: '🏦' },
  { id: 'optima', name: 'Optima Bank', icon: '🏦' },
  { id: 'bakai', name: 'Bakai Bank', icon: '🏦' },
  { id: 'demir', name: 'Demir Bank', icon: '🏦' },
  { id: 'balance', name: 'Balans', icon: '💳' }
];

export default function CheckoutModal({ onClose }: CheckoutModalProps) {
  const { items, totalAmount, clearCart } = useCart();
  const { user, profile } = useAuth();
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) throw new Error('Tizimga kiring');

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          total_amount: totalAmount,
          delivery_address: address,
          payment_method: paymentMethod as any,
          notes,
          status: 'pending',
          payment_status: paymentMethod === 'cash' ? 'pending' : 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_purchase: item.product.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      const { error: trackingError } = await supabase
        .from('order_tracking')
        .insert({
          order_id: order.id,
          status: 'pending',
          notes: 'Buyurtma qabul qilindi'
        });

      if (trackingError) throw trackingError;

      const { error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          order_id: order.id,
          amount: totalAmount,
          payment_method: paymentMethod as any,
          status: paymentMethod === 'cash' ? 'pending' : 'pending'
        });

      if (transactionError) throw transactionError;

      clearCart();
      onClose();
      alert('Buyurtma muvaffaqiyatli qabul qilindi!');
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Buyurtma berish</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} className="text-gray-700" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="inline mr-1" />
              Manzil
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Namangan viloyati, Chust tumani"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <CreditCard size={16} className="inline mr-1" />
              To'lov usuli
            </label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-4 border-2 rounded-xl transition ${
                    paymentMethod === method.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{method.icon}</div>
                  <div className="font-semibold text-sm">{method.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Izoh (ixtiyoriy)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Qo'shimcha ma'lumot..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Mahsulotlar:</span>
              <span className="font-semibold">{items.length} ta</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Jami:</span>
              <span className="text-orange-600">{formatPrice(totalAmount)} so'm</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-semibold hover:from-orange-600 hover:to-red-600 transition disabled:opacity-50"
            >
              {loading ? 'Yuborilmoqda...' : 'Tasdiqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
