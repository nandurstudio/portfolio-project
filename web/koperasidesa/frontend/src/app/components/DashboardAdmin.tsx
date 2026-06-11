import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Users, Wallet, TrendingUp, Activity, LogOut, FileText, UsersRound, CheckCircle, DollarSign, PiggyBank, Loader2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api';

import Swal from 'sweetalert2';

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getAdminDashboardStats();
        setStats(data.stats);
        setActivities(data.recent);
      } catch (error) {
        console.error('Failed to fetch admin stats', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: 'Konfirmasi Logout',
      text: 'Apakah Anda yakin ingin keluar dari sistem?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Logout',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.logout();
        } catch (e) {
          // ignore
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      }
    });
  };

  const chartData = [
    { name: 'Jan', simpanan: 400, pinjaman: 240 },
    { name: 'Feb', simpanan: 300, pinjaman: 139 },
    { name: 'Mar', simpanan: 200, pinjaman: 980 },
    { name: 'Apr', simpanan: 278, pinjaman: 390 },
    { name: 'Mei', simpanan: 189, pinjaman: 480 },
    { name: 'Jun', simpanan: 239, pinjaman: 380 }
  ];

  const getIcon = (title: string) => {
    switch (title) {
      case 'Total Anggota': return Users;
      case 'Total Simpanan': return Wallet;
      case 'Menunggu Verifikasi': return TrendingUp;
      case 'Total Transaksi': return Activity;
      default: return Activity;
    }
  };

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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl text-gray-900">Dashboard Admin</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => navigate('/admin/data-anggota')}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <UsersRound className="w-5 h-5" />
              Data Anggota
            </button>
            <button
              onClick={() => navigate('/admin/verifikasi-pinjaman')}
              className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <CheckCircle className="w-5 h-5" />
              Verifikasi Pinjaman
            </button>
            <button
              onClick={() => navigate('/admin/kelola-simpanan')}
              className="flex items-center gap-2 px-4 py-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <PiggyBank className="w-5 h-5" />
              Kelola Simpanan
            </button>
            <button
              onClick={() => navigate('/admin/pembayaran-angsuran')}
              className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <DollarSign className="w-5 h-5" />
              Pembayaran Angsuran
            </button>
            <button
              onClick={() => navigate('/admin/laporan')}
              className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <FileText className="w-5 h-5" />
              Laporan
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-xl text-gray-900 mb-1">Selamat Datang, Administrator</h2>
          <p className="text-gray-500">Ringkasan aktivitas koperasi hari ini</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = getIcon(stat.title);
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${stat.color || 'bg-blue-500'} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-gray-500 text-sm mb-1">{stat.title}</p>
                <p className="text-2xl text-gray-900 mb-2">{stat.value}</p>
                <p className="text-sm text-green-600">{stat.trend}</p>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg text-gray-900 mb-4">Grafik Transaksi (6 Bulan Terakhir)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="simpanan" stroke="#2563EB" strokeWidth={2} />
                <Line type="monotone" dataKey="pinjaman" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-6 justify-center mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-sm text-gray-600">Simpanan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span className="text-sm text-gray-600">Pinjaman</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg text-gray-900 mb-4">Perbandingan Bulanan</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="simpanan" fill="#2563EB" />
                <Bar dataKey="pinjaman" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-6 justify-center mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-sm text-gray-600">Simpanan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span className="text-sm text-gray-600">Pinjaman</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg text-gray-900">Aktivitas Terbaru</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {activities.length === 0 ? (
              <div className="p-6 text-center text-gray-500">Belum ada aktivitas terbaru</div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-900 mb-1">{activity.user}</p>
                      <p className="text-sm text-gray-500">{activity.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 mb-1">{activity.amount}</p>
                      <p className="text-sm text-gray-500">{activity.date}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
