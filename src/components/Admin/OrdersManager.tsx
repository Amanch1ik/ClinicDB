import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { MapPin, User, Phone } from 'lucide-react';
import { formatPrice, formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';

type Order = Database['public']['Tables']['orders']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
  order_items: Array<
    Database['public']['Tables']['order_items']['Row'] & {
      products: Database['public']['Tables']['products']['Row'];
    }
  >;
};

export default function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadOrders();

    const subscription = supabase
      .channel('admin_orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles!orders_customer_id_fkey(*),
        order_items(
          *,
          products(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data as any);
    }

    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus as any })
      .eq('id', orderId);

    if (!error) {
      await supabase.from('order_tracking').insert({
        order_id: orderId,
        status: newStatus as any,
        notes: `Admin tomonidan yangilandi: ${newStatus}`
      });

      loadOrders();
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const statusOptions = [
    { value: 'all', label: 'Barchasi' },
    { value: 'pending', label: 'Kutilmoqda' },
    { value: 'confirmed', label: 'Tasdiqlangan' },
    { value: 'preparing', label: 'Tayyorlanmoqda' },
    { value: 'ready', label: 'Tayyor' },
    { value: 'picked_up', label: 'Olingan' },
    { value: 'delivering', label: 'Yetkazilmoqda' },
    { value: 'delivered', label: 'Yetkazilgan' },
    { value: 'cancelled', label: 'Bekor qilingan' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Buyurtmalar</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-800">
                  Buyurtma #{order.order_number}
                </h3>
                <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${getStatusColor(
                  order.status
                )}`}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center text-sm mb-2">
                  <User size={16} className="mr-2 text-gray-600" />
                  <span className="text-gray-700">{order.profiles.full_name}</span>
                </div>
                <div className="flex items-center text-sm mb-2">
                  <Phone size={16} className="mr-2 text-gray-600" />
                  <span className="text-gray-700">{order.profiles.phone}</span>
                </div>
                <div className="flex items-start text-sm">
                  <MapPin size={16} className="mr-2 text-gray-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{order.delivery_address}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3">
                <div className="space-y-1">
                  {order.order_items.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.products.name_ru} x {item.quantity}
                      </span>
                      <span className="text-gray-600">
                        {formatPrice(item.price_at_purchase * item.quantity)} so'm
                      </span>
                    </div>
                  ))}
                  {order.order_items.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{order.order_items.length - 3} ta
                    </div>
                  )}
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-gray-200 mt-2">
                  <span>Jami:</span>
                  <span className="text-purple-600">{formatPrice(order.total_amount)} so'm</span>
                </div>
              </div>
            </div>

            {order.status !== 'delivered' && order.status !== 'cancelled' && (
              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-full font-semibold transition"
                    >
                      Tasdiqlash
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-full font-semibold transition"
                    >
                      Bekor qilish
                    </button>
                  </>
                )}

                {order.status === 'confirmed' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-full font-semibold transition"
                  >
                    Tayyorlanmoqda
                  </button>
                )}

                {order.status === 'preparing' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-full font-semibold transition"
                  >
                    Tayyor
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">Buyurtmalar topilmadi</p>
        </div>
      )}
    </div>
  );
}
