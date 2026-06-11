import { useState } from 'react';
import { useNavigate } from 'react-router';
import { UserPlus, Building2, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../api';
import Swal from 'sweetalert2';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    namaLengkap: '',
    username: '',
    password: '',
    konfirmasiPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.konfirmasiPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setIsLoading(true);

    try {
      await api.register({
        name: formData.namaLengkap,
        username: formData.username,
        password: formData.password
      });

      Swal.fire({
        icon: 'success',
        title: 'Pendaftaran Berhasil',
        text: 'Akun Anda telah terdaftar. Silakan login.',
        confirmButtonColor: '#2563eb'
      }).then(() => {
        navigate('/');
      });
    } catch (err: any) {
      setError(err.message || 'Pendaftaran gagal, silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          disabled={isLoading}
        >
          <ArrowLeft className="w-5 h-5" />
          Kembali ke Login
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl text-gray-900 mb-2">Daftar Anggota Baru</h1>
            <p className="text-gray-500">Lengkapi data diri Anda untuk bergabung</p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 mb-2">Nama Lengkap</label>
              <input
                type="text"
                value={formData.namaLengkap}
                onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="Nama lengkap sesuai KTP"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="Username untuk login"
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Konfirmasi Password</label>
                <input
                  type="password"
                  value={formData.konfirmasiPassword}
                  onChange={(e) => setFormData({ ...formData, konfirmasiPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder="Ulangi password"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Mendaftarkan...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Daftar Sekarang
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
