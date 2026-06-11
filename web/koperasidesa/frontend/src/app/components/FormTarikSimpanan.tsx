import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { api } from '../api';
import Swal from 'sweetalert2';

export default function FormTarikSimpanan() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nominal: '',
    metodePenarikan: 'cash',
    nomorRekening: ''
  });
  const [saldoTersedia, setSaldoTersedia] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getAnggotaDashboardStats();
        // Extract number from "Rp 15.250.000" formatted string
        const simpananStat = data.stats.find((s: any) => s.title === 'Total Simpanan');
        if (simpananStat) {
          const numberOnly = Number(simpananStat.value.replace(/[^0-9]/g, ''));
          setSaldoTersedia(numberOnly);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await api.submitWithdrawal({
        amount: Number(formData.nominal),
        description: `Penarikan via ${formData.metodePenarikan === 'cash' ? 'Cash' : 'Transfer bank ke rek ' + formData.nomorRekening}`
      });
      Swal.fire({
        icon: 'success',
        title: 'Pengajuan Berhasil',
        text: 'Pengajuan penarikan berhasil! Menunggu persetujuan admin.',
        confirmButtonColor: '#2563eb'
      }).then(() => {
        navigate('/anggota/dashboard');
      });
    } catch (err: any) {
      setError(err.message || 'Gagal mengajukan penarikan.');
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
          <h1 className="text-2xl text-gray-900 mb-6">Form Penarikan Simpanan</h1>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-600 mb-1">Saldo Tersedia</p>
            <p className="text-2xl text-blue-900">Rp {saldoTersedia.toLocaleString('id-ID')}</p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 mb-2">Nominal Penarikan</label>
              <input
                type="number"
                value={formData.nominal}
                onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="Masukkan nominal penarikan"
                max={saldoTersedia}
                required
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500 mt-2">Maksimal penarikan: Rp {saldoTersedia.toLocaleString('id-ID')}</p>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Metode Penarikan</label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-600">
                  <input
                    type="radio"
                    name="metodePenarikan"
                    value="cash"
                    checked={formData.metodePenarikan === 'cash'}
                    onChange={(e) => setFormData({ ...formData, metodePenarikan: e.target.value })}
                    className="w-4 h-4 text-blue-600"
                    disabled={isSubmitting}
                  />
                  <span className="text-gray-900">Cash / Tunai</span>
                </label>
                <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-600">
                  <input
                    type="radio"
                    name="metodePenarikan"
                    value="transfer"
                    checked={formData.metodePenarikan === 'transfer'}
                    onChange={(e) => setFormData({ ...formData, metodePenarikan: e.target.value })}
                    className="w-4 h-4 text-blue-600"
                    disabled={isSubmitting}
                  />
                  <span className="text-gray-900">Transfer Bank</span>
                </label>
              </div>
            </div>

            {formData.metodePenarikan === 'transfer' && (
              <div>
                <label className="block text-gray-700 mb-2">Nomor Rekening Tujuan</label>
                <input
                  type="text"
                  value={formData.nomorRekening}
                  onChange={(e) => setFormData({ ...formData, nomorRekening: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder="Masukkan nomor rekening"
                  required
                  disabled={isSubmitting}
                />
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
                    Memproses...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Ajukan Penarikan
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
