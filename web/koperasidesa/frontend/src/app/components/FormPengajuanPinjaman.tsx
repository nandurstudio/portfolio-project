import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function FormPengajuanPinjaman() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nominal: '',
    tenor: '12',
    tujuan: '',
    metodePencairan: 'cash',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const calculateAngsuran = () => {
    const nominal = parseFloat(formData.nominal) || 0;
    const tenor = parseInt(formData.tenor) || 12;
    const bunga = 0.02; // matches backend simple logic
    const total = nominal * (1 + bunga);
    const angsuranPerBulan = total / tenor;
    return {
      angsuranPerBulan,
      totalPinjaman: total,
      totalBunga: nominal * bunga
    };
  };

  const { angsuranPerBulan, totalPinjaman, totalBunga } = calculateAngsuran();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await api.submitLoan({
        amount: Number(formData.nominal),
        duration_months: Number(formData.tenor),
        description: `Tujuan: ${formData.tujuan}. Pencairan via ${formData.metodePencairan}`
      });
      alert('Pengajuan pinjaman berhasil diajukan! Menunggu persetujuan admin.');
      navigate('/anggota/dashboard');
    } catch (err: any) {
      setError(err.message || 'Gagal mengajukan pinjaman.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-2xl text-gray-900 mb-6">Form Pengajuan Pinjaman</h1>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 mb-2">Nominal Pinjaman</label>
              <input
                type="number"
                value={formData.nominal}
                onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="Masukkan nominal pinjaman"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Tenor Cicilan</label>
              <select
                value={formData.tenor}
                onChange={(e) => setFormData({ ...formData, tenor: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                disabled={isSubmitting}
              >
                <option value="6">6 Bulan</option>
                <option value="12">12 Bulan</option>
                <option value="24">24 Bulan</option>
                <option value="36">36 Bulan</option>
              </select>
            </div>

            {formData.nominal && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-green-700">Estimasi Bunga (2%)</span>
                  <span className="text-green-900">Rp {totalBunga.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Total Pinjaman + Bunga</span>
                  <span className="text-green-900">Rp {totalPinjaman.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between border-t border-green-300 pt-2">
                  <span className="text-green-700">Angsuran per Bulan</span>
                  <span className="text-green-900 text-lg">Rp {angsuranPerBulan.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-gray-700 mb-2">Tujuan Pinjaman</label>
              <textarea
                value={formData.tujuan}
                onChange={(e) => setFormData({ ...formData, tujuan: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="Jelaskan tujuan penggunaan pinjaman"
                rows={4}
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Metode Pencairan</label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-600">
                  <input
                    type="radio"
                    name="metodePencairan"
                    value="cash"
                    checked={formData.metodePencairan === 'cash'}
                    onChange={(e) => setFormData({ ...formData, metodePencairan: e.target.value })}
                    className="w-4 h-4 text-blue-600"
                    disabled={isSubmitting}
                  />
                  <span className="text-gray-900">Cash / Tunai</span>
                </label>
                <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-600">
                  <input
                    type="radio"
                    name="metodePencairan"
                    value="transfer"
                    checked={formData.metodePencairan === 'transfer'}
                    onChange={(e) => setFormData({ ...formData, metodePencairan: e.target.value })}
                    className="w-4 h-4 text-blue-600"
                    disabled={isSubmitting}
                  />
                  <span className="text-gray-900">Transfer Bank</span>
                </label>
              </div>
            </div>

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
                    Mengajukan...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Ajukan Pinjaman
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
