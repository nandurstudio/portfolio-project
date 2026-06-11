import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Eye, CheckCircle, XCircle, User, FileText, DollarSign, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function VerifikasiPinjaman() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchLoans = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminLoans();
      setLoans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleAction = async (id: number, status: 'approved' | 'rejected') => {
    if (!confirm(`Apakah Anda yakin ingin ${status === 'approved' ? 'menyetujui' : 'menolak'} pengajuan pinjaman ini?`)) {
      return;
    }
    setIsVerifying(true);
    try {
      await api.verifyLoan(id, status);
      alert(`Pengajuan pinjaman telah ${status === 'approved' ? 'disetujui' : 'ditolak'}!`);
      setSelectedId(null);
      fetchLoans();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses verifikasi.');
    } finally {
      setIsVerifying(false);
    }
  };

  const selected = loans.find(p => p.id === selectedId);

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
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl text-gray-900 mb-1">Verifikasi Pengajuan Pinjaman</h1>
          <p className="text-gray-500">Review dan verifikasi pengajuan pinjaman anggota</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100 font-medium text-gray-950">
                Daftar Pengajuan ({loans.length})
              </div>
              <div className="divide-y divide-gray-100">
                {loans.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">Tidak ada pengajuan pinjaman</div>
                ) : (
                  loans.map((pengajuan) => (
                    <button
                      key={pengajuan.id}
                      onClick={() => setSelectedId(pengajuan.id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedId === pengajuan.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-gray-900 font-medium">{pengajuan.user?.name || 'Anggota'}</p>
                          <p className="text-sm text-gray-500">A-2026-{pengajuan.user_id?.toString().padStart(3, '0')}</p>
                        </div>
                        <Eye className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-lg text-blue-600 mb-1">Rp {Number(pengajuan.amount).toLocaleString('id-ID')}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        pengajuan.status === 'approved' ? 'bg-green-100 text-green-700' :
                        pengajuan.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {pengajuan.status}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selected ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl text-gray-900 mb-6 font-semibold">Detail Pengajuan</h3>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-5 h-5 text-blue-600" />
                        <h4 className="text-gray-950 font-medium">Data Anggota</h4>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div>
                          <p className="text-sm text-gray-500">Nama Lengkap</p>
                          <p className="text-gray-900 font-medium">{selected.user?.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">No. Anggota</p>
                          <p className="text-gray-900 font-medium">A-2026-{selected.user_id?.toString().padStart(3, '0')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                        <h4 className="text-gray-950 font-medium">Detail Pinjaman</h4>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div>
                          <p className="text-sm text-gray-500">Nominal Pinjaman</p>
                          <p className="text-xl text-gray-900 font-bold">Rp {Number(selected.amount).toLocaleString('id-ID')}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Tenor</p>
                            <p className="text-gray-900 font-medium">{selected.duration_months} bulan</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Angsuran/Bulan</p>
                            <p className="text-gray-900 font-medium">Rp {Number(selected.monthly_installment).toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Tujuan / Deskripsi</p>
                          <p className="text-gray-900">{selected.description || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {selected.status === 'pending' && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleAction(selected.id, 'rejected')}
                      disabled={isVerifying}
                      className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Tolak Pengajuan
                    </button>
                    <button
                      onClick={() => handleAction(selected.id, 'approved')}
                      disabled={isVerifying}
                      className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Setujui Pengajuan
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Pilih pengajuan dari daftar untuk melihat detail</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
