import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Plus, CreditCard as Edit, Trash2 } from 'lucide-react';
import { formatPrice } from '../../lib/utils';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export default function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [productsResult, categoriesResult] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order')
    ]);

    if (productsResult.data) setProducts(productsResult.data);
    if (categoriesResult.data) setCategories(categoriesResult.data);
    setLoading(false);
  };

  const toggleAvailability = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_available: !product.is_available })
      .eq('id', product.id);

    if (!error) {
      loadData();
    }
  };

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
        <h2 className="text-xl font-bold text-gray-800">Mahsulotlar</h2>
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full font-semibold transition flex items-center gap-2">
          <Plus size={20} />
          Yangi mahsulot
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div
              className="h-32 flex items-center justify-center text-4xl font-bold"
              style={{ backgroundColor: product.color }}
            >
              {product.name}
            </div>

            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-800 mb-1">
                {product.name_ru || product.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {product.description_ru || product.description}
              </p>

              <div className="flex items-center justify-between mb-3">
                <span className="text-xl font-bold text-purple-600">
                  {formatPrice(product.price)} so'm
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    product.is_available
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {product.is_available ? 'Mavjud' : 'Mavjud emas'}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleAvailability(product)}
                  className={`flex-1 py-2 rounded-full font-semibold transition ${
                    product.is_available
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {product.is_available ? 'O\'chirish' : 'Yoqish'}
                </button>
                <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition">
                  <Edit size={20} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
