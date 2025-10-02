import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Plus, Settings } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { formatPrice } from '../../lib/utils';
import ProductDetailModal from './ProductDetailModal';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export default function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [categoriesResult, productsResult] = await Promise.all([
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('products').select('*').eq('is_available', true)
    ]);

    if (categoriesResult.data) setCategories(categoriesResult.data);
    if (productsResult.data) setProducts(productsResult.data);
    setLoading(false);
  };

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category_id === selectedCategory)
    : products;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Barcha mahsulotlar</h1>
        </div>

        <div className="px-4 pb-4 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
              selectedCategory === null
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hammasi
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                selectedCategory === category.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.icon} {category.name_ru || category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <div
            key={product.id}
            className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition"
          >
            <div
              className="h-48 flex items-center justify-center text-6xl font-bold"
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

              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-orange-600">
                  {formatPrice(product.price)} so'm
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition"
                  >
                    <Settings size={20} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => addItem(product)}
                    className="p-2 bg-orange-500 hover:bg-orange-600 rounded-full transition"
                  >
                    <Plus size={20} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
