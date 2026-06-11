import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Search, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '../api';
import Swal from 'sweetalert2';

export default function KelolaSimpanan() {
  const navigate = useNavigate();
  const [savingsList, setSavingsList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchSavings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminSavings();
      setSavingsList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavings();
  }, []);

  const handleAction = (id: number, status: 'approved' | 'rejected') => {
    Swal.fire({
      title: 'Konfirmasi Tindakan',
      text: `Apakah Anda yakin ingin ${status === 'approved' ? 'menyetujui' : 'menolak'} simpanan ini?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: status === 'approved' ? '#16a34a' : '#dc2626',
      cancelButtonColor: '#4b5563',
      confirmButtonText: status === 'approved' ? 'Ya, Setujui' : 'Ya, Tolak',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsVerifying(true);
        try {
          await api.verifySaving(id, status);
          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: `Status simpanan berhasil diubah menjadi: ${status === 'approved' ? 'Disetujui' : 'Ditolak'}`,
            confirmButtonColor: '#2563eb'
          });
          fetchSavings();
        } catch (err: any) {
          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: err.message || 'Gagal memproses verifikasi.',
            confirmButtonColor: '#2563eb'
          });
        } finally {
          setIsVerifying(false);
        }
      }
    });
  };

  const filteredData = savingsList.filter(
    (item) =>
      item.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            disabled={isVerifying}
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl text-gray-900 mb-1">Verifikasi Simpanan Anggota</h1>
          <p className="text-gray-500">Kelola dan setujui pengajuan setoran simpanan anggota</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari berdasarkan nama anggota atau jenis simpanan..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600 font-medium">No. Anggota</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600 font-medium">Nama Anggota</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600 font-medium">Jenis Simpanan</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600 font-medium">Nominal</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600 font-medium">Keterangan</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600 font-medium">Tanggal</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600 font-medium">Status</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Tidak ada pengajuan simpanan ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">A-2026-{item.user_id?.toString().padStart(3, '0')}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.user?.name || 'Anggota'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Simpanan {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-bold">
                        Rp {Number(item.amount).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.description || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm px-2 py-0.5 rounded-full ${
                          item.status === 'approved' ? 'bg-green-100 text-green-700' :
                          item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(item.id, 'approved')}
                              disabled={isVerifying}
                              className="p-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200"
                              title="Setujui"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAction(item.id, 'rejected')}
                              disabled={isVerifying}
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200"
                              title="Tolak"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
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
