import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Save, Smartphone, Banknote, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function FormSimpanan() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'pilih-metode' | 'form'>('pilih-metode');
  const [formData, setFormData] = useState({
    jenisSimpanan: 'pokok',
    nominal: '',
    metodeSetor: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMetodeSelect = (metode: string) => {
    setFormData({ ...formData, metodeSetor: metode });
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await api.submitSaving({
        type: formData.jenisSimpanan,
        amount: Number(formData.nominal),
        description: `Setoran via ${formData.metodeSetor === 'online' ? 'Online/Transfer' : 'Tunai/Cash'}`,
      });
      alert('Simpanan berhasil diajukan! Menunggu persetujuan admin.');
      navigate('/anggota/dashboard');
    } catch (err: any) {
      setError(err.message || 'Gagal mengajukan simpanan.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'pilih-metode') {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <button
              onClick={() => navigate('/anggota/dashboard')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali ke Dashboard
            </button>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl text-gray-900 mb-2">Pilih Metode Setor Simpanan</h1>
            <p className="text-gray-500">Pilih cara penyetoran yang Anda inginkan</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => handleMetodeSelect('online')}
              className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 hover:border-blue-600 p-8 transition-all hover:shadow-lg group text-left"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 transition-colors">
                <Smartphone className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl text-gray-900 mb-3 text-center">Setor Online</h3>
              <p className="text-gray-600 mb-6 text-center">Transfer melalui rekening bank dan konfirmasi pengajuan</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Praktis dan cepat</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Proses verifikasi 1x24 jam</span>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleMetodeSelect('tunai')}
              className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 hover:border-green-600 p-8 transition-all hover:shadow-lg group text-left"
            >
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-green-600 transition-colors">
                <Banknote className="w-8 h-8 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl text-gray-900 mb-3 text-center">Setor Tunai / Cash</h3>
              <p className="text-gray-600 mb-6 text-center">Setor langsung di kantor koperasi</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Langsung tercatat oleh admin</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Dapat struk bukti setor</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => setStep('pilih-metode')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            disabled={isLoading}
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              formData.metodeSetor === 'online' ? 'bg-blue-600' : 'bg-green-600'
            }`}>
              {formData.metodeSetor === 'online' ? (
                <Smartphone className="w-6 h-6 text-white" />
              ) : (
                <Banknote className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-2xl text-gray-900">Form Simpanan</h1>
              <p className="text-sm text-gray-500">
                Metode: {formData.metodeSetor === 'online' ? 'Setor Online' : 'Setor Tunai'}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 mb-2">Jenis Simpanan</label>
              <select
                value={formData.jenisSimpanan}
                onChange={(e) => setFormData({ ...formData, jenisSimpanan: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                disabled={isLoading}
              >
                <option value="pokok">Simpanan Pokok</option>
                <option value="wajib">Simpanan Wajib</option>
                <option value="sukarela">Simpanan Sukarela</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Nominal Simpanan</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                <input
                  type="number"
                  value={formData.nominal}
                  onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder="0"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {formData.metodeSetor === 'online' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 mb-2">Informasi Rekening Transfer</p>
                <div className="space-y-1">
                  <p className="text-sm text-blue-700">Bank BCA</p>
                  <p className="text-lg text-blue-900">1234567890</p>
                  <p className="text-sm text-blue-700">a.n. Koperasi Simpan Pinjam</p>
                </div>
              </div>
            )}

            {formData.metodeSetor === 'tunai' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-900 mb-2">Informasi Setor Tunai</p>
                <p className="text-sm text-green-700">
                  Silakan datang ke kantor koperasi dengan membawa uang tunai. Petugas kami akan memproses penyetoran Anda dan menyetujuinya di dashboard.
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setStep('pilih-metode')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Ajukan Simpanan
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
