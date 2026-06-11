import { useNavigate } from 'react-router';
import { ArrowLeft, Wallet, TrendingUp, Clock, CheckCircle2, XCircle, Bell, FileText } from 'lucide-react';

export default function LihatInformasi() {
  const navigate = useNavigate();

  const statusSimpanan = [
    { jenis: 'Simpanan Pokok', saldo: 'Rp 5.000.000', terakhir: '15 Apr 2026' },
    { jenis: 'Simpanan Wajib', saldo: 'Rp 7.250.000', terakhir: '10 Apr 2026' },
    { jenis: 'Simpanan Sukarela', saldo: 'Rp 3.000.000', terakhir: '01 Apr 2026' }
  ];

  const riwayatPinjaman = [
    {
      id: 1,
      nominal: 'Rp 25.000.000',
      tenor: '24 bulan',
      tanggal: '05 Apr 2026',
      status: 'Aktif',
      angsuranKe: '1/24',
      sisaPinjaman: 'Rp 24.450.000'
    },
    {
      id: 2,
      nominal: 'Rp 10.000.000',
      tenor: '12 bulan',
      tanggal: '10 Jan 2025',
      status: 'Lunas',
      angsuranKe: '12/12',
      sisaPinjaman: 'Rp 0'
    }
  ];

  const statusAngsuran = [
    { bulan: 'April 2026', nominal: 'Rp 1.050.000', jatuhTempo: '25 Apr 2026', status: 'Lunas' },
    { bulan: 'Mei 2026', nominal: 'Rp 1.050.000', jatuhTempo: '25 Mei 2026', status: 'Menunggu' },
    { bulan: 'Juni 2026', nominal: 'Rp 1.050.000', jatuhTempo: '25 Jun 2026', status: 'Menunggu' }
  ];

  const pengajuanPinjaman = [
    {
      id: 1,
      nominal: 'Rp 15.000.000',
      tanggal: '16 Apr 2026',
      status: 'Menunggu Verifikasi',
      keterangan: 'Sedang dalam proses verifikasi admin'
    }
  ];

  const notifikasi = [
    {
      id: 1,
      title: 'Pembayaran Angsuran Berhasil',
      message: 'Pembayaran angsuran bulan April telah berhasil diproses',
      date: '15 Apr 2026',
      type: 'success'
    },
    {
      id: 2,
      title: 'Pengingat Jatuh Tempo',
      message: 'Angsuran bulan Mei jatuh tempo pada tanggal 25 Mei 2026',
      date: '18 Apr 2026',
      type: 'warning'
    },
    {
      id: 3,
      title: 'Pinjaman Disetujui',
      message: 'Pengajuan pinjaman sebesar Rp 25.000.000 telah disetujui',
      date: '05 Apr 2026',
      type: 'success'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/anggota/dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl text-gray-900 mb-1">Informasi Lengkap</h1>
          <p className="text-gray-500">Detail status simpanan, pinjaman, dan notifikasi</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg text-gray-900">Status Simpanan</h3>
            </div>
            <div className="space-y-4">
              {statusSimpanan.map((item, index) => (
                <div key={index} className="pb-4 border-b border-gray-100 last:border-0">
                  <p className="text-sm text-gray-600 mb-1">{item.jenis}</p>
                  <p className="text-lg text-gray-900 mb-1">{item.saldo}</p>
                  <p className="text-xs text-gray-500">Terakhir: {item.terakhir}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Simpanan</span>
                <span className="text-lg text-blue-600">Rp 15.250.000</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg text-gray-900">Riwayat Pinjaman</h3>
            </div>
            <div className="space-y-4">
              {riwayatPinjaman.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-lg text-gray-900">{item.nominal}</p>
                      <p className="text-sm text-gray-600">Tenor: {item.tenor}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.status === 'Aktif'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">Angsuran: {item.angsuranKe}</p>
                  <p className="text-sm text-gray-700">Sisa: {item.sisaPinjaman}</p>
                  <p className="text-xs text-gray-500 mt-2">Tanggal: {item.tanggal}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg text-gray-900">Status Angsuran</h3>
            </div>
            <div className="space-y-3">
              {statusAngsuran.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm text-gray-900">{item.bulan}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.status === 'Lunas'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 mb-1">{item.nominal}</p>
                  <p className="text-xs text-gray-500">Jatuh Tempo: {item.jatuhTempo}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg text-gray-900">Pengajuan Pinjaman</h3>
            </div>
            <div className="space-y-4">
              {pengajuanPinjaman.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xl text-gray-900 mb-1">{item.nominal}</p>
                      <p className="text-sm text-gray-500">{item.tanggal}</p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{item.keterangan}</p>
                  <button
                    onClick={() => navigate('/anggota/status-pinjaman')}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Lihat Detail →
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-lg text-gray-900">Notifikasi Koperasi</h3>
            </div>
            <div className="space-y-3">
              {notifikasi.map((notif) => (
                <div key={notif.id} className="p-4 border-l-4 rounded-lg bg-gray-50" style={{
                  borderLeftColor: notif.type === 'success' ? '#10B981' : '#F59E0B'
                }}>
                  <div className="flex items-start gap-3">
                    {notif.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Bell className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 mb-1">{notif.title}</p>
                      <p className="text-xs text-gray-600 mb-2">{notif.message}</p>
                      <p className="text-xs text-gray-500">{notif.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
