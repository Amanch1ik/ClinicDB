import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { useCart } from '../../contexts/CartContext';
import { formatPrice } from '../../lib/utils';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem(product, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden">
        <div className="relative">
          <div
            className="h-64 flex items-center justify-center text-7xl font-bold"
            style={{ backgroundColor: product.color }}
          >
            {product.name}
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition"
          >
            <X size={24} className="text-gray-700" />
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {product.name_ru || product.name}
          </h2>
          <p className="text-gray-600 mb-6">
            {product.description_ru || product.description}
          </p>

          <div className="text-3xl font-bold text-orange-600 mb-6">
            {formatPrice(product.price)} so'm
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center bg-gray-100 rounded-full">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-6 py-3 hover:bg-gray-200 rounded-l-full transition font-bold text-xl"
              >
                -
              </button>
              <span className="px-6 py-3 font-bold text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-6 py-3 hover:bg-gray-200 rounded-r-full transition font-bold text-xl"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-full font-semibold hover:from-orange-600 hover:to-red-600 transition flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Savatga qo'shish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
