import { useState, useEffect } from 'react';
import { X, MapPin, Clock, Package, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { formatPrice, formatDate, getStatusColor, getStatusLabel, getPaymentMethodLabel } from '../../lib/utils';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'] & {
  products: Database['public']['Tables']['products']['Row'];
};
type OrderTracking = Database['public']['Tables']['order_tracking']['Row'];

interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

interface OrderDetailModalProps {
  order: OrderWithItems;
  onClose: () => void;
}

export default function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const [tracking, setTracking] = useState<OrderTracking[]>([]);

  useEffect(() => {
    loadTracking();

    const subscription = supabase
      .channel(`order_tracking_${order.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_tracking',
          filter: `order_id=eq.${order.id}`
        },
        () => {
          loadTracking();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [order.id]);

  const loadTracking = async () => {
    const { data } = await supabase
      .from('order_tracking')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false });

    if (data) setTracking(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Buyurtma #{order.order_number}
            </h2>
            <span
              className={`inline-block mt-2 px-3 py-1 rounded-full text-white text-xs font-semibold ${getStatusColor(
                order.status
              )}`}
            >
              {getStatusLabel(order.status)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} className="text-gray-700" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Package size={18} className="mr-2" />
              Mahsulotlar
            </h3>
            <div className="space-y-2">
              {order.order_items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: item.products.color }}
                    >
                      {item.products.name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {item.products.name_ru}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatPrice(item.price_at_purchase)} so'm x {item.quantity}
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold text-gray-800">
                    {formatPrice(item.price_at_purchase * item.quantity)} so'm
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <MapPin size={18} className="text-gray-600 mr-2" />
              <span className="font-semibold text-gray-800">Yetkazish manzili</span>
            </div>
            <p className="text-gray-700 ml-7">{order.delivery_address}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">To'lov usuli:</span>
              <span className="font-semibold text-gray-800">
                {getPaymentMethodLabel(order.payment_method)}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">To'lov holati:</span>
              <span className="font-semibold text-gray-800">
                {order.payment_status === 'completed' ? 'To\'langan' : 'Kutilmoqda'}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span>Jami:</span>
              <span className="text-orange-600">{formatPrice(order.total_amount)} so'm</span>
            </div>
          </div>

          {tracking.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Truck size={18} className="mr-2" />
                Kuzatuv tarixi
              </h3>
              <div className="space-y-3">
                {tracking.map((track, index) => (
                  <div key={track.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-orange-500' : 'bg-gray-300'
                        }`}
                      />
                      {index < tracking.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-semibold ${
                            index === 0 ? 'text-orange-600' : 'text-gray-600'
                          }`}
                        >
                          {getStatusLabel(track.status)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(track.created_at)}
                        </span>
                      </div>
                      {track.notes && (
                        <p className="text-sm text-gray-600 mt-1">{track.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.notes && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Izoh</h3>
              <p className="text-gray-700">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
