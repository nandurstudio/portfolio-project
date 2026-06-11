import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Calendar, FileText, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function StatusPengajuanPinjaman() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const data = await api.getLoans();
        setLoans(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLoans();
  }, []);

  const getTimeline = (status: string, date: string) => {
    if (status === 'pending') {
      return [
        { step: 'Pengajuan Diterima', date: date, done: true },
        { step: 'Verifikasi Dokumen', date: 'Dalam proses', done: false },
        { step: 'Persetujuan Admin', date: 'Menunggu', done: false }
      ];
    } else if (status === 'approved') {
      return [
        { step: 'Pengajuan Diterima', date: date, done: true },
        { step: 'Verifikasi Dokumen', date: date, done: true },
        { step: 'Persetujuan Admin (Disetujui)', date: date, done: true }
      ];
    } else {
      return [
        { step: 'Pengajuan Diterima', date: date, done: true },
        { step: 'Verifikasi Dokumen', date: date, done: true },
        { step: 'Ditolak', date: date, done: true }
      ];
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
          <h1 className="text-2xl text-gray-900 mb-1">Status Pengajuan Pinjaman</h1>
          <p className="text-gray-500">Pantau status pengajuan pinjaman Anda</p>
        </div>

        {loans.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            Anda belum mengajukan pinjaman.
          </div>
        ) : (
          <div className="space-y-6">
            {loans.map((item) => {
              const formattedDate = new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className={`px-6 py-4 ${
                    item.status === 'pending' ? 'bg-yellow-50 border-b border-yellow-200' :
                    item.status === 'approved' ? 'bg-green-50 border-b border-green-200' :
                    'bg-red-50 border-b border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.status === 'pending' && (
                          <>
                            <Clock className="w-6 h-6 text-yellow-600" />
                            <div>
                              <p className="text-yellow-900 font-medium">Menunggu Verifikasi</p>
                              <p className="text-sm text-yellow-700">Pengajuan #{item.id}</p>
                            </div>
                          </>
                        )}
                        {item.status === 'approved' && (
                          <>
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                            <div>
                              <p className="text-green-900 font-medium">Disetujui</p>
                              <p className="text-sm text-green-700">Pengajuan #{item.id}</p>
                            </div>
                          </>
                        )}
                        {item.status === 'rejected' && (
                          <>
                            <XCircle className="w-6 h-6 text-red-600" />
                            <div>
                              <p className="text-red-900 font-medium">Ditolak</p>
                              <p className="text-sm text-red-700">Pengajuan #{item.id}</p>
                            </div>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{formattedDate}</p>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Nominal Pinjaman</p>
                          <p className="text-2xl text-gray-900 font-bold">Rp {Number(item.amount).toLocaleString('id-ID')}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Tenor</p>
                            <p className="text-gray-900 font-medium">{item.duration_months} bulan</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Angsuran/Bulan</p>
                            <p className="text-gray-900 font-medium">Rp {Number(item.monthly_installment).toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Sisa Pinjaman</p>
                          <p className="text-gray-900 font-medium text-orange-600">Rp {Number(item.remaining_amount).toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Keterangan / Tujuan</p>
                          <p className="text-gray-900">{item.description || '-'}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className={`p-4 rounded-lg border-l-4 ${
                          item.status === 'pending' ? 'bg-yellow-50 border-yellow-400' :
                          item.status === 'approved' ? 'bg-green-50 border-green-400' :
                          'bg-red-50 border-red-400'
                        }`}>
                          <p className="text-sm text-gray-600 mb-1 font-medium">Informasi Status</p>
                          <p className="text-gray-900">
                            {item.status === 'pending' && 'Pengajuan pinjaman sedang ditinjau oleh tim admin koperasi.'}
                            {item.status === 'approved' && 'Selamat! Pinjaman Anda telah disetujui dan sisa pinjaman akan berkurang saat Anda melakukan angsuran.'}
                            {item.status === 'rejected' && 'Maaf, pengajuan pinjaman Anda ditolak. Silakan buat pengajuan baru dengan melengkapi data/alasan yang sesuai.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-600" />
                        Timeline Pengajuan
                      </h4>
                      <div className="space-y-3">
                        {getTimeline(item.status, formattedDate).map((step, index, arr) => (
                          <div key={index} className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                step.done ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                              }`}>
                                {step.done ? (
                                  <CheckCircle2 className="w-5 h-5 text-white" />
                                ) : (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>
                              {index < arr.length - 1 && (
                                <div className={`w-0.5 h-12 ${step.done ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className={`font-medium ${step.done ? 'text-gray-900' : 'text-gray-500'}`}>
                                {step.step}
                              </p>
                              <p className="text-sm text-gray-500">{step.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
