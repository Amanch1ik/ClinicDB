import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Database } from '../../lib/database.types';
import { Package, MapPin, Clock } from 'lucide-react';
import { formatPrice, formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';
import OrderDetailModal from './OrderDetailModal';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'] & {
  products: Database['public']['Tables']['products']['Row'];
};

interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();

      const subscription = supabase
        .channel('orders_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `customer_id=eq.${user.id}`
          },
          () => {
            loadOrders();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          products(*)
        )
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data as OrderWithItems[]);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Package size={64} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Buyurtmalar yo'q</h2>
          <p className="text-gray-600">Siz hali buyurtma bermagansiz</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white sticky top-0 z-10 shadow-sm px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-800">Mening buyurtmalarim</h1>
      </div>

      <div className="p-4 space-y-4">
        {orders.map(order => (
          <div
            key={order.id}
            onClick={() => setSelectedOrder(order)}
            className="bg-white rounded-2xl shadow-md p-4 cursor-pointer hover:shadow-lg transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-800">
                  Buyurtma #{order.order_number}
                </h3>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <Clock size={14} className="mr-1" />
                  {formatDate(order.created_at)}
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${getStatusColor(
                  order.status
                )}`}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>

            <div className="space-y-2 mb-3">
              {order.order_items.slice(0, 2).map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.products.name_ru} x {item.quantity}
                  </span>
                  <span className="text-gray-600">
                    {formatPrice(item.price_at_purchase * item.quantity)} so'm
                  </span>
                </div>
              ))}
              {order.order_items.length > 2 && (
                <div className="text-sm text-gray-500">
                  +{order.order_items.length - 2} ta mahsulot
                </div>
              )}
            </div>

            <div className="flex items-center text-sm text-gray-600 mb-3">
              <MapPin size={14} className="mr-1 flex-shrink-0" />
              <span className="line-clamp-1">{order.delivery_address}</span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-600">Jami:</span>
              <span className="text-xl font-bold text-orange-600">
                {formatPrice(order.total_amount)} so'm
              </span>
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
