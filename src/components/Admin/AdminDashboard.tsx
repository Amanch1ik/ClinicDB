import { useState } from 'react';
import { Package, Users, ShoppingBag, TrendingUp } from 'lucide-react';
import ProductsManager from './ProductsManager';
import OrdersManager from './OrdersManager';
import UsersManager from './UsersManager';

type Tab = 'overview' | 'products' | 'orders' | 'users';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs = [
    { id: 'overview' as Tab, name: 'Umumiy', icon: TrendingUp },
    { id: 'products' as Tab, name: 'Mahsulotlar', icon: ShoppingBag },
    { id: 'orders' as Tab, name: 'Buyurtmalar', icon: Package },
    { id: 'users' as Tab, name: 'Foydalanuvchilar', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-purple-100">Karakol Delivery boshqaruvi</p>
      </div>

      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon size={20} />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'products' && <ProductsManager />}
        {activeTab === 'orders' && <OrdersManager />}
        {activeTab === 'users' && <UsersManager />}
      </div>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Jami buyurtmalar</span>
            <Package className="text-purple-500" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-800">0</div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Faol buyurtmalar</span>
            <TrendingUp className="text-blue-500" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-800">0</div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Foydalanuvchilar</span>
            <Users className="text-green-500" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-800">0</div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Mahsulotlar</span>
            <ShoppingBag className="text-orange-500" size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-800">0</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Xush kelibsiz!</h2>
        <p className="text-gray-600">
          Admin panelida siz mahsulotlar, buyurtmalar va foydalanuvchilarni boshqarishingiz mumkin.
        </p>
      </div>
    </div>
  );
}
