import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Database } from '../../lib/database.types';
import { Package, MapPin, Phone, CheckCircle, Navigation } from 'lucide-react';
import { formatPrice, formatDate, getStatusColor } from '../../lib/utils';

type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items: Array<
    Database['public']['Tables']['order_items']['Row'] & {
      products: Database['public']['Tables']['products']['Row'];
    }
  >;
  profiles: Database['public']['Tables']['profiles']['Row'];
};

export default function CourierDashboard() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile?.role === 'courier') {
      loadOrders();

      const subscription = supabase
        .channel('courier_orders')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `courier_id=eq.${user.id}`
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
  }, [user, profile]);

  const loadOrders = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          products(*)
        ),
        profiles!orders_customer_id_fkey(*)
      `)
      .or(`courier_id.eq.${user.id},status.eq.confirmed`)
      .in('status', ['confirmed', 'ready', 'picked_up', 'delivering'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data as any);
    }

    setLoading(false);
  };

  const acceptOrder = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({
        courier_id: user!.id,
        status: 'preparing'
      })
      .eq('id', orderId);

    if (!error) {
      await supabase.from('order_tracking').insert({
        order_id: orderId,
        status: 'preparing',
        notes: 'Kuryer qabul qildi'
      });

      loadOrders();
    }
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
        notes: `Status: ${newStatus}`
      });

      loadOrders();
    }
  };

  const startNavigation = (order: Order) => {
    if (order.delivery_lat && order.delivery_lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${order.delivery_lat},${order.delivery_lng}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  const myOrders = orders.filter(o => o.courier_id === user?.id);
  const availableOrders = orders.filter(o => !o.courier_id && o.status === 'confirmed');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
        <h1 className="text-2xl font-bold mb-2">Kuryer paneli</h1>
        <p className="text-blue-100">Salom, {profile?.full_name}!</p>
      </div>

      <div className="p-4 space-y-6">
        {availableOrders.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">Mavjud buyurtmalar</h2>
            <div className="space-y-3">
              {availableOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl shadow-md p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800">Buyurtma #{order.order_number}</h3>
                      <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                    </div>
                    <span className="text-lg font-bold text-orange-600">
                      {formatPrice(order.total_amount)} so'm
                    </span>
                  </div>

                  <div className="flex items-start text-sm text-gray-700 mb-3">
                    <MapPin size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                    <span>{order.delivery_address}</span>
                  </div>

                  <button
                    onClick={() => acceptOrder(order.id)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-full font-semibold transition"
                  >
                    Qabul qilish
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {myOrders.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">Mening buyurtmalarim</h2>
            <div className="space-y-3">
              {myOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl shadow-md p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800">Buyurtma #{order.order_number}</h3>
                      <span
                        className={`inline-block mt-1 px-2 py-1 rounded-full text-white text-xs font-semibold ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-orange-600">
                      {formatPrice(order.total_amount)} so'm
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-sm">
                      <Phone size={16} className="mr-2 text-gray-600" />
                      <span className="text-gray-700">{(order.profiles as any)?.phone}</span>
                    </div>
                    <div className="flex items-start text-sm">
                      <MapPin size={16} className="mr-2 text-gray-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{order.delivery_address}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="col-span-2 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-full font-semibold transition"
                      >
                        Tayyor
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'picked_up')}
                        className="col-span-2 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-full font-semibold transition"
                      >
                        Oldim
                      </button>
                    )}

                    {order.status === 'picked_up' && (
                      <>
                        <button
                          onClick={() => startNavigation(order)}
                          className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-full font-semibold transition flex items-center justify-center gap-1"
                        >
                          <Navigation size={16} />
                          Yo'nalish
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivering')}
                          className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-full font-semibold transition"
                        >
                          Yo'lda
                        </button>
                      </>
                    )}

                    {order.status === 'delivering' && (
                      <>
                        <button
                          onClick={() => startNavigation(order)}
                          className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-full font-semibold transition flex items-center justify-center gap-1"
                        >
                          <Navigation size={16} />
                          Yo'nalish
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-full font-semibold transition flex items-center justify-center gap-1"
                        >
                          <CheckCircle size={16} />
                          Yetkazdim
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {myOrders.length === 0 && availableOrders.length === 0 && (
          <div className="text-center py-12">
            <Package size={64} className="text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Buyurtmalar yo'q</h2>
            <p className="text-gray-600">Hozircha yangi buyurtmalar yo'q</p>
          </div>
        )}
      </div>
    </div>
  );
}
