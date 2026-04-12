import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { notify } from '../../utils/notify'

type UserRow = {
    id: number
    member_nik?: string | null
    name: string
    username: string
    role: string
    is_active?: boolean
    member?: {
        nik: string
        department?: string | null
        site?: string | null
    }
    created_at?: string
}

type RoleOption = {
    value: string
    label: string
}

type MemberOption = {
    nik: string
    name: string
    email?: string | null
    department?: string | null
    site?: string | null
    is_eligible?: boolean
    has_voted?: boolean
}

export default function MasterUsersPage() {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [rows, setRows] = useState<UserRow[]>([])
    const [showModal, setShowModal] = useState(false)
    const [editId, setEditId] = useState<number | null>(null)
    const [page, setPage] = useState(1)
    const [perPage] = useState(10)
    const [roleOptions, setRoleOptions] = useState<RoleOption[]>([])
    const [memberSearchResults, setMemberSearchResults] = useState<MemberOption[]>([])
    const [defaultPassword, setDefaultPassword] = useState('Kkm12345!')
    const [memberQuery, setMemberQuery] = useState('')
    const [searchingMember, setSearchingMember] = useState(false)
    const [memberNik, setMemberNik] = useState('')
    const [memberName, setMemberName] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('')
    const [formIsActive, setFormIsActive] = useState(true)

    const loadMeta = async () => {
        const res = await api.get('/admin/users/meta')
        const roles = Array.isArray(res?.data?.roles) ? res.data.roles : []
        const defaultPass = typeof res?.data?.default_password === 'string' ? res.data.default_password : 'Kkm12345!'
        setRoleOptions(roles)
        setDefaultPassword(defaultPass)
        if (!role && roles.length > 0) {
            setRole(roles[0].value)
        }
    }

    const loadUsers = async () => {
        const res = await api.get('/admin/users')
        const data = Array.isArray(res?.data) ? res.data : res?.data?.data ?? []
        setRows(data)
    }

    const resetForm = () => {
        setEditId(null)
        setMemberQuery('')
        setMemberSearchResults([])
        setMemberNik('')
        setMemberName('')
        setUsername('')
        setPassword('')
        if (roleOptions.length > 0) {
            setRole(roleOptions[0].value)
        }
        setFormIsActive(true)
    }

    const openCreateModal = () => {
        resetForm()
        setShowModal(true)
    }

    const openEditModal = (row: UserRow) => {
        setEditId(row.id)
        setMemberNik(row.member_nik || '')
        setMemberName(row.name || '')
        setUsername(row.username || '')
        setPassword('')
        setRole(row.role || (roleOptions[0]?.value ?? ''))
        setFormIsActive(row.is_active !== false)
        setMemberSearchResults([])
        setMemberQuery('')
        setShowModal(true)
    }

    const searchMember = async () => {
        const q = memberQuery.trim()
        if (!q) {
            notify.warning('Input Pencarian Kosong', 'Masukkan NIK atau nama untuk mencari anggota.')
            return
        }

        setSearchingMember(true)
        try {
            const res = await api.get('/admin/users/meta', {
                params: { q },
            })
            const list = Array.isArray(res?.data?.available_members) ? res.data.available_members : []
            setMemberSearchResults(list)

            if (list.length === 0) {
                notify.info('Data Tidak Ditemukan', 'Anggota tidak ditemukan atau sudah memiliki akun user.')
            }
        } catch (err: any) {
            setMemberSearchResults([])
            notify.error('Cari Anggota Gagal', err?.response?.data?.message || 'Gagal mencari anggota')
        } finally {
            setSearchingMember(false)
        }
    }

    const pickMember = (member: MemberOption) => {
        setMemberNik(member.nik)
        setMemberName(member.name)
        if (!username.trim()) {
            const generated = `${member.name}`
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '.')
                .replace(/^\.+|\.+$/g, '')
                .slice(0, 24)
            setUsername(generated || member.nik.toLowerCase())
        }
        notify.success('Anggota Dipilih', `${member.name} (${member.nik})`)
    }

    const toggleUserAccess = async (row: UserRow, nextActive: boolean) => {
        setSaving(true)
        try {
            await api.put(`/admin/users/${row.id}`, { is_active: nextActive })
            notify.success('Status Akses Diperbarui', nextActive ? 'Akses user diaktifkan.' : 'Akses user dinonaktifkan.')
            await loadUsers()
        } catch (err: any) {
            notify.error('Update Status Gagal', err?.response?.data?.message || 'Gagal mengubah status akses user')
        } finally {
            setSaving(false)
        }
    }

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                await Promise.all([loadMeta(), loadUsers()])
            } catch (err: any) {
                notify.error('Load Data User Gagal', err?.response?.data?.message || 'Gagal memuat data user')
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            if (editId) {
                const payload: Record<string, unknown> = {
                    role,
                    is_active: formIsActive,
                }

                if (password.trim()) {
                    payload.password = password
                }

                await api.put(`/admin/users/${editId}`, payload)
                notify.success('Berhasil', 'User berhasil diupdate.')
            } else {
                if (!memberNik.trim()) {
                    notify.warning('Anggota Belum Dipilih', 'Silakan pilih anggota dari hasil pencarian NIK/Nama terlebih dahulu.')
                    setSaving(false)
                    return
                }

                await api.post('/admin/users', {
                    member_nik: memberNik,
                    username,
                    password: password.trim() || undefined,
                    role,
                })
                notify.success('User Baru Dibuat', `Password default: ${defaultPassword}`)
            }

            setShowModal(false)
            await Promise.all([loadMeta(), loadUsers()])
            resetForm()
        } catch (err: any) {
            const validationErrors = err?.response?.data?.errors
            if (validationErrors && typeof validationErrors === 'object') {
                const firstKey = Object.keys(validationErrors)[0]
                const firstMessage = Array.isArray(validationErrors[firstKey])
                    ? validationErrors[firstKey][0]
                    : null
                notify.error('Validasi Gagal', firstMessage || err?.response?.data?.message || 'Validasi user gagal')
            } else {
                notify.error('Simpan User Gagal', err?.response?.data?.message || 'Gagal menyimpan user')
            }
        } finally {
            setSaving(false)
        }
    }

    const pagedRows = useMemo(() => {
        const start = (page - 1) * perPage
        return rows.slice(start, start + perPage)
    }, [rows, page, perPage])

    const totalPages = Math.max(1, Math.ceil(rows.length / perPage))

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages)
        }
    }, [page, totalPages])

    return (
        <section className="admin-simple-card">
            <h2>Master User</h2>
            <p>Daftar akun internal yang dapat mengakses sistem admin. Role dipilih dari dropdown master, bukan input manual.</p>

            {loading ? <p>Memuat user...</p> : null}

            <div className="admin-chip-list" style={{ marginBottom: 12 }}>
                <button type="button" className="btn btn-primary" onClick={openCreateModal}>
                    + Tambah User
                </button>
            </div>

            <div className="admin-table-wrap">
                <table className="admin-table admin-table--mobile-friendly">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>NIK</th>
                            <th>Nama</th>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagedRows.map((row) => (
                            <tr key={row.id}>
                                <td data-label="ID">{row.id}</td>
                                <td data-label="NIK">{row.member_nik || '-'}</td>
                                <td data-label="Nama">{row.name}</td>
                                <td data-label="Username" style={{ wordBreak: 'break-word' }}>{row.username}</td>
                                <td data-label="Role">{row.role}</td>
                                <td data-label="Status">{row.is_active === false ? 'Nonaktif' : 'Aktif'}</td>
                                <td data-label="Aksi">
                                    <div className="admin-chip-list">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => openEditModal(row)}
                                        >
                                            Edit
                                        </button>
                                        {row.is_active === false ? (
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={() => toggleUserAccess(row, true)}
                                                disabled={saving}
                                            >
                                                Aktifkan
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => toggleUserAccess(row, false)}
                                                disabled={saving}
                                            >
                                                Nonaktifkan
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!loading && pagedRows.length === 0 ? (
                            <tr>
                                <td colSpan={7}>Belum ada data user.</td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>

            <div className="votes-monitor-pagination" style={{ justifyContent: 'space-between', marginTop: 12 }}>
                <span>Total {rows.length} user</span>
                <div className="admin-chip-list">
                    <button
                        type="button"
                        className="secondary"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={page <= 1}
                    >
                        Sebelumnya
                    </button>
                    <span style={{ alignSelf: 'center' }}>Halaman {page} / {totalPages}</span>
                    <button
                        type="button"
                        className="secondary"
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={page >= totalPages}
                    >
                        Berikutnya
                    </button>
                </div>
            </div>

            {showModal ? (
                <div className="admin-modal-backdrop">
                    <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>{editId ? `Edit User #${editId}` : 'Tambah User'}</h3>
                            <button type="button" className="admin-modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <form className="admin-auth-form" onSubmit={handleSubmit}>
                            {!editId ? (
                                <>
                                    <label>
                                        Cari Anggota (NIK / Nama)
                                        <input
                                            value={memberQuery}
                                            onChange={(e) => setMemberQuery(e.target.value)}
                                            placeholder="contoh: 3024 atau Beny"
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={searchMember}
                                        disabled={searchingMember}
                                    >
                                        {searchingMember ? 'Mencari...' : 'Cari Anggota'}
                                    </button>

                                    {memberSearchResults.length > 0 ? (
                                        <div className="admin-member-search-results">
                                            {memberSearchResults.map((member) => (
                                                <button
                                                    key={member.nik}
                                                    type="button"
                                                    className={`admin-member-result ${memberNik === member.nik ? 'active' : ''}`}
                                                    onClick={() => pickMember(member)}
                                                >
                                                    <strong>{member.name}</strong>
                                                    <span>{member.nik} • {member.department || '-'} • {member.site || '-'}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : null}

                                    <label>
                                        Anggota Terpilih
                                        <input value={memberNik ? `${memberName} (${memberNik})` : '-'} readOnly />
                                    </label>
                                </>
                            ) : (
                                <label>
                                    Anggota
                                    <input value={`${memberName} (${memberNik || '-'})`} readOnly />
                                </label>
                            )}

                            <label>
                                Username
                                <input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="contoh: beny.santoso"
                                    required={!editId}
                                    readOnly={Boolean(editId)}
                                />
                            </label>

                            <label>
                                Password {editId ? '(opsional untuk ganti password)' : `(kosongkan untuk default: ${defaultPassword})`}
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    minLength={8}
                                    required={false}
                                />
                            </label>

                            <label>
                                Role
                                <select value={role} onChange={(e) => setRole(e.target.value)} required>
                                    {roleOptions.map((item) => (
                                        <option key={item.value} value={item.value}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {editId ? (
                                <label>
                                    Status Akses
                                    <select
                                        value={formIsActive ? '1' : '0'}
                                        onChange={(e) => setFormIsActive(e.target.value === '1')}
                                    >
                                        <option value="1">Aktif</option>
                                        <option value="0">Nonaktif</option>
                                    </select>
                                </label>
                            ) : null}

                            <div className="admin-chip-list">
                                <button className="btn btn-primary" type="submit" disabled={saving}>
                                    {saving ? 'Menyimpan...' : editId ? 'Update User' : 'Buat User'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                    disabled={saving}
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </section>
    )
}
