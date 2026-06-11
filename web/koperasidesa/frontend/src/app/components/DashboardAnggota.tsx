import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Wallet, TrendingUp, CreditCard, LogOut, Plus, Minus, FileText, DollarSign, Info, Clock, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function DashboardAnggota() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const fetchData = async () => {
      try {
        const statsData = await api.getAnggotaDashboardStats();
        setStats(statsData.stats);

        const trxData = await api.getAnggotaTransactions();
        setTransactions(trxData);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wallet': return Wallet;
      case 'TrendingUp': return TrendingUp;
      case 'CreditCard': return CreditCard;
      case 'Clock': return Clock;
      default: return Wallet;
    }
  };

  const quickActions = [
    { title: 'Simpan', icon: Plus, path: '/anggota/simpanan', color: 'bg-blue-600' },
    { title: 'Tarik Simpanan', icon: Minus, path: '/anggota/tarik-simpanan', color: 'bg-green-600' },
    { title: 'Ajukan Pinjaman', icon: FileText, path: '/anggota/pengajuan-pinjaman', color: 'bg-purple-600' },
    { title: 'Bayar Angsuran', icon: DollarSign, path: '/anggota/bayar-angsuran', color: 'bg-orange-600' },
    { title: 'Lihat Informasi', icon: Info, path: '/anggota/informasi', color: 'bg-cyan-600' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl text-gray-900">Dashboard Anggota</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-xl text-gray-900 mb-1">Selamat Datang, {user?.name || 'Anggota'}</h2>
          <p className="text-gray-500">No. Anggota: A-2026-{user?.id?.toString().padStart(3, '0')}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = getIcon(stat.title === 'Total Simpanan' ? 'Wallet' : stat.title === 'Total Pinjaman' ? 'TrendingUp' : stat.title === 'Sisa Angsuran' ? 'CreditCard' : 'Clock');
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">{stat.trend}</span>
                </div>
                <p className="text-gray-500 text-sm mb-1">{stat.title}</p>
                <p className="text-2xl text-gray-900">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="mb-8">
          <h3 className="text-lg text-gray-900 mb-4">Menu Cepat</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className={`${action.color} hover:opacity-90 text-white p-6 rounded-xl shadow-sm transition-all hover:shadow-md`}
              >
                <action.icon className="w-8 h-8 mb-3 mx-auto" />
                <p className="text-center">{action.title}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg text-gray-900">Riwayat Transaksi Terbaru</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Tanggal</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Jenis Transaksi</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Nominal</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      Belum ada transaksi
                    </td>
                  </tr>
                ) : (
                  transactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{trx.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{trx.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{trx.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm px-3 py-1 rounded-full ${
                          trx.status === 'Berhasil' || trx.status === 'Disetujui'
                            ? 'bg-green-100 text-green-700'
                            : trx.status === 'Diproses' || trx.status === 'Verifikasi'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {trx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
