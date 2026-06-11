import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Search, UserPlus, ToggleLeft, ToggleRight, Loader2, Save, X } from 'lucide-react';
import { api } from '../api';

export default function DataAnggota() {
  const navigate = useNavigate();
  const [anggotaList, setAnggotaList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAnggota, setSelectedAnggota] = useState<any>(null);
  
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formStatus, setFormStatus] = useState('aktif');
  const [isSaving, setIsSaving] = useState(false);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminMembers();
      setAnggotaList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormStatus('aktif');
    setShowModal(true);
  };

  const handleOpenEdit = (item: any) => {
    setModalMode('edit');
    setSelectedAnggota(item);
    setFormName(item.name);
    setFormUsername(item.username);
    setFormPassword('');
    setFormStatus(item.status);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (modalMode === 'create') {
        await api.createAdminMember({
          name: formName,
          username: formUsername,
          password: formPassword
        });
        alert('Anggota berhasil ditambahkan!');
      } else {
        await api.updateAdminMember(selectedAnggota.id, {
          name: formName,
          status: formStatus,
          password: formPassword || undefined
        });
        alert('Anggota berhasil diupdate!');
      }
      setShowModal(false);
      fetchMembers();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (item: any) => {
    const nextStatus = item.status === 'aktif' ? 'nonaktif' : 'aktif';
    try {
      await api.updateAdminMember(item.id, {
        name: item.name,
        status: nextStatus
      });
      fetchMembers();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status.');
    }
  };

  const filteredData = anggotaList.filter(
    (anggota) =>
      anggota.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      anggota.username.toLowerCase().includes(searchTerm.toLowerCase())
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
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl text-gray-900 mb-1">Data Anggota</h1>
            <p className="text-gray-500">Kelola data anggota koperasi</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
          >
            <UserPlus className="w-5 h-5" />
            Tambah Anggota
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari berdasarkan nama atau username..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600 font-medium">No. Anggota</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600 font-medium">Nama Lengkap</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600 font-medium">Username</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600 font-medium">Status</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Tidak ada anggota ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredData.map((anggota) => (
                    <tr key={anggota.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">A-2026-{anggota.id.toString().padStart(3, '0')}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{anggota.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{anggota.username}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm px-3 py-1 rounded-full ${anggota.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {anggota.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEdit(anggota)}
                            className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleStatus(anggota)}
                            className={`p-1.5 rounded-lg border transition-colors ${anggota.status === 'aktif' ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
                          >
                            {anggota.status === 'aktif' ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="text-xl text-gray-900 mb-4 font-semibold">
              {modalMode === 'create' ? 'Tambah Anggota Baru' : 'Edit Data Anggota'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              {modalMode === 'create' && (
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Password {modalMode === 'edit' && '(Kosongkan jika tidak diganti)'}
                </label>
                <input
                  type="password"
                  required={modalMode === 'create'}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              {modalMode === 'edit' && (
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
