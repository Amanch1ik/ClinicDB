import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Phone, LogOut, Save } from 'lucide-react';
import { formatPrice } from '../../lib/utils';

export default function ProfilePage() {
  const { profile, updateProfile, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    const { error: updateError } = await updateProfile({
      full_name: fullName,
      phone
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess('Profil yangilandi');
      setEditing(false);
    }

    setLoading(false);
  };

  const handleCancel = () => {
    setFullName(profile?.full_name || '');
    setPhone(profile?.phone || '');
    setEditing(false);
    setError('');
    setSuccess('');
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-800">Mening profilim</h1>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
          <div className="flex items-center justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center">
              <User size={48} className="text-white" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{profile.phone}</h2>
            <p className="text-gray-600">{profile.full_name}</p>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Balans:</span>
              <span className="text-2xl font-bold text-orange-600">
                {formatPrice(profile.balance)} so'm
              </span>
            </div>
          </div>

          {(error || success) && (
            <div
              className={`mb-4 px-4 py-3 rounded-xl text-sm ${
                error
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-green-50 border border-green-200 text-green-700'
              }`}
            >
              {error || success}
            </div>
          )}

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ism va familiya
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon raqam
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-semibold hover:from-orange-600 hover:to-red-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={20} />
                  {loading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-full font-semibold transition"
            >
              Tahrirlash
            </button>
          )}
        </div>

        <button
          onClick={signOut}
          className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-semibold transition flex items-center justify-center gap-2"
        >
          <LogOut size={20} />
          Chiqish
        </button>
      </div>
    </div>
  );
}
