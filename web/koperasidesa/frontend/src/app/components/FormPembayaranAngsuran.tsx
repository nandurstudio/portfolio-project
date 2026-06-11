import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function FormPembayaranAngsuran() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nominalBayar: '',
    metodePembayaran: 'cash',
  });
  const [activeLoan, setActiveLoan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchActiveLoan = async () => {
      try {
        const loans = await api.getLoans();
        const active = loans.find((l: any) => l.status === 'approved' && Number(l.remaining_amount) > 0);
        if (active) {
          setActiveLoan(active);
          setFormData(prev => ({ ...prev, nominalBayar: active.monthly_installment.toString() }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActiveLoan();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLoan) return;

    setIsSubmitting(true);
    setError('');

    try {
      await api.payInstallment({
        loan_id: activeLoan.id,
        amount: Number(formData.nominalBayar)
      });
      alert('Pembayaran angsuran berhasil diajukan! Menunggu persetujuan admin.');
      navigate('/anggota/dashboard');
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim pembayaran angsuran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  const totalTagihan = activeLoan ? Number(activeLoan.monthly_installment) : 0;
  const sisaPinjaman = activeLoan ? Number(activeLoan.remaining_amount) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/anggota/dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            disabled={isSubmitting}
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <h1 className="text-2xl text-gray-900 mb-6">Form Pembayaran Angsuran</h1>

          {!activeLoan ? (
            <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
              Anda tidak memiliki pinjaman aktif yang perlu dibayar.
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-600 mb-1">Tagihan Angsuran</p>
                  <p className="text-2xl text-orange-900 font-bold">Rp {totalTagihan.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-600 mb-1">Sisa Pinjaman Anda</p>
                  <p className="text-2xl text-blue-900 font-bold">Rp {sisaPinjaman.toLocaleString('id-ID')}</p>
                </div>
              </div>

              {error && (
                <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 mb-2">Nominal Pembayaran</label>
                  <input
                    type="number"
                    value={formData.nominalBayar}
                    onChange={(e) => setFormData({ ...formData, nominalBayar: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="Masukkan nominal pembayaran"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, nominalBayar: totalTagihan.toString() })}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 block"
                    disabled={isSubmitting}
                  >
                    Set sesuai tagihan (Rp {totalTagihan.toLocaleString('id-ID')})
                  </button>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Metode Pembayaran</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-600">
                      <input
                        type="radio"
                        name="metodePembayaran"
                        value="cash"
                        checked={formData.metodePembayaran === 'cash'}
                        onChange={(e) => setFormData({ ...formData, metodePembayaran: e.target.value })}
                        className="w-4 h-4 text-blue-600"
                        disabled={isSubmitting}
                      />
                      <span className="text-gray-900">Cash / Tunai</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-600">
                      <input
                        type="radio"
                        name="metodePembayaran"
                        value="transfer"
                        checked={formData.metodePembayaran === 'transfer'}
                        onChange={(e) => setFormData({ ...formData, metodePembayaran: e.target.value })}
                        className="w-4 h-4 text-blue-600"
                        disabled={isSubmitting}
                      />
                      <span className="text-gray-900">Transfer Bank</span>
                    </label>
                  </div>
                </div>

                {formData.metodePembayaran === 'transfer' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900 mb-2">Silakan transfer ke rekening:</p>
                    <p className="text-sm text-blue-700">Bank BCA: 1234567890 (a.n. Koperasi Simpan Pinjam)</p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/anggota/dashboard')}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isSubmitting}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Bayar Sekarang
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
