import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Printer, Loader2, DollarSign } from 'lucide-react';
import { api } from '../api';

export default function LaporanKeuangan() {
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await api.getAdminReports();
        setReport(data);
      } catch (err) {
        console.error(err);
      }
      setIsLoading(false);
    };
    fetchReports();
  }, []);

  const handlePrint = () => {
    window.print();
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
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl text-gray-900 mb-1">Laporan Keuangan</h1>
            <p className="text-gray-500">Laporan lengkap saldo dan cashflow koperasi</p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
          >
            <Printer className="w-5 h-5" />
            Print Laporan
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Total Pemasukan (Simpanan & Angsuran)</p>
            <p className="text-2xl text-green-600 font-bold">
              Rp {Number(report?.income || 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Total Pengeluaran (Penarikan & Pencairan Pinjaman)</p>
            <p className="text-2xl text-red-600 font-bold">
              Rp {Number(report?.expense || 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Kas Bersih Koperasi</p>
            <p className="text-2xl text-blue-600 font-bold">
              Rp {Number(report?.balance || 0).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg text-gray-900 mb-6 font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Rincian Pos Keuangan
          </h3>
          <div className="divide-y divide-gray-100">
            <div className="py-4 flex justify-between">
              <span className="text-gray-600">Total Simpanan Masuk</span>
              <span className="font-semibold text-gray-900">Rp {Number(report?.total_savings || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="py-4 flex justify-between">
              <span className="text-gray-600">Total Penarikan Simpanan</span>
              <span className="font-semibold text-gray-900">Rp {Number(report?.total_withdrawals || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="py-4 flex justify-between">
              <span className="text-gray-600">Total Pinjaman Disalurkan</span>
              <span className="font-semibold text-gray-900">Rp {Number(report?.total_loans || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="py-4 flex justify-between">
              <span className="text-gray-600">Total Angsuran Diterima</span>
              <span className="font-semibold text-gray-900">Rp {Number(report?.total_installments || 0).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
