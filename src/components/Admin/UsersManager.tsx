import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { User, Phone, Shield } from 'lucide-react';
import { formatPrice, formatDate } from '../../lib/utils';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function UsersManager() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
    }

    setLoading(false);
  };

  const updateUserRole = async (userId: string, newRole: 'customer' | 'courier' | 'admin') => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      loadUsers();
    }
  };

  const toggleUserStatus = async (user: Profile) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !user.is_active })
      .eq('id', user.id);

    if (!error) {
      loadUsers();
    }
  };

  const filteredUsers =
    filter === 'all' ? users : users.filter(u => u.role === filter);

  const roleOptions = [
    { value: 'all', label: 'Barchasi' },
    { value: 'customer', label: 'Mijozlar' },
    { value: 'courier', label: 'Kuryerlar' },
    { value: 'admin', label: 'Adminlar' }
  ];

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      customer: 'Mijoz',
      courier: 'Kuryer',
      admin: 'Admin'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      customer: 'bg-blue-100 text-blue-700',
      courier: 'bg-green-100 text-green-700',
      admin: 'bg-purple-100 text-purple-700'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
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
        <h2 className="text-xl font-bold text-gray-800">Foydalanuvchilar</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
        >
          {roleOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                  <User size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{user.full_name}</h3>
                  <p className="text-sm text-gray-600">{user.phone}</p>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  user.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {user.is_active ? 'Faol' : 'Faol emas'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Rol:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Balans:</span>
                <span className="font-semibold text-purple-600">
                  {formatPrice(user.balance)} so'm
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Ro'yxatdan o'tgan:</span>
                <span className="text-gray-700">
                  {new Date(user.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <select
                value={user.role}
                onChange={(e) => updateUserRole(user.id, e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="customer">Mijoz</option>
                <option value="courier">Kuryer</option>
                <option value="admin">Admin</option>
              </select>

              <button
                onClick={() => toggleUserStatus(user)}
                className={`w-full py-2 rounded-lg font-semibold transition text-sm ${
                  user.is_active
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {user.is_active ? 'Bloklash' : 'Aktivlashtirish'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">Foydalanuvchilar topilmadi</p>
        </div>
      )}
    </div>
  );
}
