import { FormEvent, useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { getStoredAdminUser } from '../../components/admin/authStorage'
import { notify } from '../../utils/notify'

type MemberStatus = {
    is_registered: boolean
    has_otp_requested: boolean
    has_otp_verified: boolean
    has_login_activity: boolean
    has_redeemed: boolean
    has_gopay_submitted: boolean
    total_valid_votes: number
    last_otp_requested_at?: string | null
    last_otp_verified_at?: string | null
    last_redeemed_at?: string | null
}

type MemberRow = {
    id: number
    nik: string
    name: string
    site?: string | null
    department?: string | null
    department_id?: number | null
    department_master_name?: string | null
    email?: string | null
    gopay_number?: string | null
    voucher_code?: string | null
    is_gopay_owner_self?: boolean
    gopay_owner_number?: string | null
    is_eligible: boolean
    has_voted: boolean
    status: MemberStatus
    created_at?: string
    updated_at?: string
}

type PagedResponse<T> = {
    data: T[]
    current_page: number
    last_page: number
    per_page: number
    total: number
    meta?: {
        total_karyawan?: number
        total_eligible?: number
    }
}

type FilterState = {
    search: string
    has_voted: '' | '1' | '0'
    is_eligible: '' | '1' | '0'
    has_gopay: '' | '1' | '0'
    is_registered: '' | '1' | '0'
    has_redeemed: '' | '1' | '0'
}

type MemberFormState = {
    nik: string
    name: string
    email: string
    site: string
    department: string
    department_id: string
    gopay_number: string
    is_gopay_owner_self: boolean
    gopay_owner_number: string
    is_eligible: boolean
    has_voted: boolean
}

const defaultFilters: FilterState = {
    search: '',
    has_voted: '',
    is_eligible: '',
    has_gopay: '',
    is_registered: '',
    has_redeemed: '',
}

const defaultForm: MemberFormState = {
    nik: '',
    name: '',
    email: '',
    site: '',
    department: '',
    department_id: '',
    gopay_number: '',
    is_gopay_owner_self: true,
    gopay_owner_number: '',
    is_eligible: true,
    has_voted: false,
}

function formatDate(value?: string | null) {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('id-ID')
}

function boolText(v: boolean) {
    return v ? 'Ya' : 'Tidak'
}

function statusEmoji(v: boolean) {
    return v ? '✅ Ya' : '❌ Tidak'
}

export default function MasterMembersPage() {
    const currentUser = useMemo(() => getStoredAdminUser(), [])
    const canSeeVoucherCode = currentUser?.role === 'super_admin'
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [rows, setRows] = useState<MemberRow[]>([])
    const [filters, setFilters] = useState<FilterState>(defaultFilters)
    const [page, setPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [form, setForm] = useState<MemberFormState>(defaultForm)
    const [totalKaryawan, setTotalKaryawan] = useState(0)
    const [totalEligible, setTotalEligible] = useState(0)

    const loadMembers = async (targetPage = page) => {
        setLoading(true)
        try {
            const params: Record<string, string | number> = {
                page: targetPage,
                per_page: 15,
            }

            const search = filters.search.trim()
            if (search) params.search = search
            if (filters.has_voted) params.has_voted = filters.has_voted === '1' ? 'true' : 'false'
            if (filters.is_eligible) params.is_eligible = filters.is_eligible === '1' ? 'true' : 'false'
            if (filters.has_gopay) params.has_gopay = filters.has_gopay === '1' ? 'true' : 'false'
            if (filters.is_registered) params.is_registered = filters.is_registered === '1' ? 'true' : 'false'
            if (filters.has_redeemed) params.has_redeemed = filters.has_redeemed === '1' ? 'true' : 'false'

            const res = await api.get<PagedResponse<MemberRow>>('/admin/master-members', { params })
            const payload = res?.data
            setRows(Array.isArray(payload?.data) ? payload.data : [])
            setPage(payload?.current_page || targetPage)
            setLastPage(payload?.last_page || 1)
            setTotal(payload?.total || 0)
            setTotalKaryawan(Number(payload?.meta?.total_karyawan || 0))
            setTotalEligible(Number(payload?.meta?.total_eligible || 0))
        } catch (err: any) {
            notify.error('Load Master Member Gagal', err?.response?.data?.message || 'Tidak bisa memuat data member')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadMembers(1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const openAddModal = () => {
        setEditingId(null)
        setForm(defaultForm)
        setShowModal(true)
    }

    const openEditModal = (row: MemberRow) => {
        setEditingId(row.id)
        setForm({
            nik: row.nik || '',
            name: row.name || '',
            email: row.email || '',
            site: row.site || '',
            department: row.department || '',
            department_id: row.department_id ? String(row.department_id) : '',
            gopay_number: row.gopay_number || '',
            is_gopay_owner_self: row.is_gopay_owner_self !== false,
            gopay_owner_number: row.gopay_owner_number || '',
            is_eligible: !!row.is_eligible,
            has_voted: !!row.has_voted,
        })
        setShowModal(true)
    }

    const updateForm = <K extends keyof MemberFormState>(key: K, value: MemberFormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()

        const nik = form.nik.trim().toUpperCase()
        const name = form.name.trim()

        if (!nik || !name) {
            notify.warning('Input Belum Lengkap', 'NIK dan Nama wajib diisi.')
            return
        }

        const payload: Record<string, unknown> = {
            nik,
            name,
            email: form.email.trim() || null,
            site: form.site.trim() || null,
            department: form.department.trim() || null,
            department_id: form.department_id.trim() ? Number(form.department_id) : null,
            gopay_number: form.gopay_number.trim() || null,
            is_gopay_owner_self: form.is_gopay_owner_self,
            gopay_owner_number: form.gopay_owner_number.trim() || null,
            is_eligible: form.is_eligible,
            has_voted: form.has_voted,
        }

        setSaving(true)
        try {
            if (editingId) {
                await api.put(`/admin/master-members/${editingId}`, payload)
                notify.success('Member Diupdate', 'Perubahan data member berhasil disimpan.')
            } else {
                await api.post('/admin/master-members', payload)
                notify.success('Member Ditambahkan', 'Data member baru berhasil dibuat.')
            }

            setShowModal(false)
            await loadMembers(page)
        } catch (err: any) {
            const validationErrors = err?.response?.data?.errors
            if (validationErrors && typeof validationErrors === 'object') {
                const firstKey = Object.keys(validationErrors)[0]
                const firstMessage = Array.isArray(validationErrors[firstKey])
                    ? validationErrors[firstKey][0]
                    : null
                notify.error('Validasi Gagal', firstMessage || err?.response?.data?.message || 'Validasi data member gagal')
            } else {
                notify.error('Simpan Data Gagal', err?.response?.data?.message || 'Tidak bisa menyimpan data member')
            }
        } finally {
            setSaving(false)
        }
    }

    const quickToggle = async (row: MemberRow, key: 'has_voted' | 'is_eligible', nextValue: boolean) => {
        setSaving(true)
        try {
            await api.put(`/admin/master-members/${row.id}`, { [key]: nextValue })
            notify.success('Status Diperbarui', `${key === 'has_voted' ? 'Status vote' : 'Status eligible'} berhasil diubah.`)
            await loadMembers(page)
        } catch (err: any) {
            notify.error('Update Status Gagal', err?.response?.data?.message || 'Tidak bisa update status')
        } finally {
            setSaving(false)
        }
    }

    const quickToggleRedeemed = async (row: MemberRow, nextValue: boolean) => {
        setSaving(true)
        try {
            await api.put(`/admin/master-members/${row.id}`, { has_redeemed: nextValue })
            notify.success('Status Redeem Diperbarui', nextValue ? 'Member ditandai redeemed.' : 'Status redeemed dibatalkan.')
            await loadMembers(page)
        } catch (err: any) {
            notify.error('Update Redeem Gagal', err?.response?.data?.message || 'Tidak bisa update status redeemed')
        } finally {
            setSaving(false)
        }
    }

    const handleExportComparison = async () => {
        setExporting(true)
        try {
            const params: Record<string, string> = {}

            const search = filters.search.trim()
            if (search) params.search = search
            if (filters.has_voted) params.has_voted = filters.has_voted === '1' ? 'true' : 'false'
            if (filters.is_eligible) params.is_eligible = filters.is_eligible === '1' ? 'true' : 'false'

            const res = await api.get('/admin/master-members/export', {
                params,
                responseType: 'blob',
            })

            const contentDisposition = String(res.headers?.['content-disposition'] || '')
            const fileNameMatch = contentDisposition.match(/filename="?([^\"]+)"?/i)
            const fileName = fileNameMatch?.[1] || `master-members-komparasi-vote-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.csv`

            const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.setAttribute('download', fileName)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(downloadUrl)

            notify.success('Export Berhasil', 'File komparasi voting berhasil diunduh.')
        } catch (err: any) {
            notify.error('Export Gagal', err?.response?.data?.message || 'Tidak bisa export data komparasi voting')
        } finally {
            setExporting(false)
        }
    }

    const summary = useMemo(() => {
        const voted = rows.filter((r) => r.has_voted).length
        const withGopay = rows.filter((r) => (r.gopay_number || '').trim() !== '' || r.status?.has_gopay_submitted).length
        const registered = rows.filter((r) => r.status?.is_registered).length
        const otpVerified = rows.filter((r) => r.status?.has_otp_verified).length
        const redeemed = rows.filter((r) => r.status?.has_redeemed).length
        return { voted, withGopay, registered, otpVerified, redeemed }
    }, [rows])

    return (
        <section className="admin-simple-card">
            <h2>Master Members</h2>
            <p>Kelola data member lengkap (core profile, status vote, GoPay, OTP, register/login, dan redeem).</p>

            <div className="admin-chip-list" style={{ marginBottom: 10 }}>
                <span className="admin-chip">Total Karyawan: {totalKaryawan}</span>
                <span className="admin-chip">Total Eligible: {totalEligible}</span>
                <span className="admin-chip">Total (halaman ini): {rows.length}</span>
                <span className="admin-chip">Sudah Vote: {summary.voted}</span>
                <span className="admin-chip">Sudah Isi GoPay: {summary.withGopay}</span>
                <span className="admin-chip">Sudah Register: {summary.registered}</span>
                <span className="admin-chip">OTP Verified: {summary.otpVerified}</span>
                <span className="admin-chip">Sudah Redeem: {summary.redeemed}</span>
            </div>

            <div className="votes-monitor-filters">
                <label>
                    Cari (NIK/Nama/Email/Site/Dept)
                    <input
                        value={filters.search}
                        onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                        placeholder="contoh: 200100030"
                    />
                </label>

                <label>
                    Status Vote
                    <select
                        value={filters.has_voted}
                        onChange={(e) => setFilters((prev) => ({ ...prev, has_voted: e.target.value as FilterState['has_voted'] }))}
                    >
                        <option value="">Semua</option>
                        <option value="1">Sudah Vote</option>
                        <option value="0">Belum Vote</option>
                    </select>
                </label>

                <label>
                    Eligible
                    <select
                        value={filters.is_eligible}
                        onChange={(e) => setFilters((prev) => ({ ...prev, is_eligible: e.target.value as FilterState['is_eligible'] }))}
                    >
                        <option value="">Semua</option>
                        <option value="1">Eligible</option>
                        <option value="0">Non-Eligible</option>
                    </select>
                </label>

                <label>
                    GoPay
                    <select
                        value={filters.has_gopay}
                        onChange={(e) => setFilters((prev) => ({ ...prev, has_gopay: e.target.value as FilterState['has_gopay'] }))}
                    >
                        <option value="">Semua</option>
                        <option value="1">Sudah Isi</option>
                        <option value="0">Belum Isi</option>
                    </select>
                </label>

                <label>
                    Register
                    <select
                        value={filters.is_registered}
                        onChange={(e) => setFilters((prev) => ({ ...prev, is_registered: e.target.value as FilterState['is_registered'] }))}
                    >
                        <option value="">Semua</option>
                        <option value="1">Sudah Register</option>
                        <option value="0">Belum Register</option>
                    </select>
                </label>

                <label>
                    Redeem
                    <select
                        value={filters.has_redeemed}
                        onChange={(e) => setFilters((prev) => ({ ...prev, has_redeemed: e.target.value as FilterState['has_redeemed'] }))}
                    >
                        <option value="">Semua</option>
                        <option value="1">Sudah Redeem</option>
                        <option value="0">Belum Redeem</option>
                    </select>
                </label>
            </div>

            <div className="votes-monitor-actions">
                <button type="button" onClick={() => loadMembers(1)} disabled={loading}>Apply Filter</button>
                <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                        setFilters(defaultFilters)
                        setTimeout(() => loadMembers(1), 0)
                    }}
                    disabled={loading}
                >
                    Reset Filter
                </button>
                <button type="button" className="secondary" onClick={handleExportComparison} disabled={exporting || loading}>
                    {exporting ? 'Menyiapkan Export...' : 'Export Komparasi Excel (.csv)'}
                </button>
                <button type="button" className="secondary" onClick={openAddModal}>+ Tambah Member</button>
            </div>

            {loading ? <p>Memuat data member...</p> : null}

            <div className="admin-table-wrap" style={{ marginTop: 10 }}>
                <table className="admin-table admin-table--mobile-friendly">
                    <thead>
                        <tr>
                            <th>NIK / Nama</th>
                            <th>Kontak</th>
                            <th>Site / Department</th>
                            <th>GoPay</th>
                            <th>Status</th>
                            <th>OTP / Login / Redeem</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id}>
                                <td data-label="NIK / Nama">
                                    <strong>{row.name}</strong>
                                    <br />
                                    <span>{row.nik}</span>
                                </td>
                                <td data-label="Kontak">
                                    <div>{row.email || '-'}</div>
                                    <small>Updated: {formatDate(row.updated_at)}</small>
                                </td>
                                <td data-label="Site / Department">
                                    <div>Site: {row.site || '-'}</div>
                                    <div>Dept: {row.department || '-'}</div>
                                </td>
                                <td data-label="GoPay">
                                    <div>No: {row.gopay_number || '-'}</div>
                                    <div>Self Owner: {boolText(row.is_gopay_owner_self !== false)}</div>
                                    <div>Owner No: {row.gopay_owner_number || '-'}</div>
                                    {canSeeVoucherCode ? (
                                        <div>
                                            Voucher:{' '}
                                            {row.voucher_code ? (
                                                /^https?:\/\//i.test(row.voucher_code) ? (
                                                    <a href={row.voucher_code} target="_blank" rel="noreferrer">
                                                        Buka Link
                                                    </a>
                                                ) : (
                                                    <span>{row.voucher_code}</span>
                                                )
                                            ) : (
                                                '-'
                                            )}
                                        </div>
                                    ) : null}
                                </td>
                                <td data-label="Status">
                                    <div>Eligible: <strong>{statusEmoji(row.is_eligible)}</strong></div>
                                    <div>Has Voted: <strong>{statusEmoji(row.has_voted)}</strong></div>
                                    <div>Valid Votes: <strong>{row.status?.total_valid_votes ?? 0}</strong></div>
                                    <div>Registered: <strong>{statusEmoji(!!row.status?.is_registered)}</strong></div>
                                </td>
                                <td data-label="OTP / Login / Redeem">
                                    <div>OTP Requested: {statusEmoji(!!row.status?.has_otp_requested)}</div>
                                    <div>OTP Verified: {statusEmoji(!!row.status?.has_otp_verified)}</div>
                                    <div>Login Activity: {statusEmoji(!!row.status?.has_login_activity)}</div>
                                    <div>Redeemed: {statusEmoji(!!row.status?.has_redeemed)}</div>
                                    <small>
                                        Last OTP: {formatDate(row.status?.last_otp_requested_at)}
                                        <br />
                                        Last Redeem: {formatDate(row.status?.last_redeemed_at)}
                                    </small>
                                </td>
                                <td data-label="Aksi">
                                    <div className="admin-chip-list">
                                        <button className="btn btn-secondary" type="button" onClick={() => openEditModal(row)}>
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            type="button"
                                            disabled={saving}
                                            onClick={() => quickToggle(row, 'has_voted', !row.has_voted)}
                                        >
                                            {row.has_voted ? 'Set Belum Vote' : 'Set Sudah Vote'}
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            type="button"
                                            disabled={saving}
                                            onClick={() => quickToggle(row, 'is_eligible', !row.is_eligible)}
                                        >
                                            {row.is_eligible ? 'Set Non-Eligible' : 'Set Eligible'}
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            type="button"
                                            disabled={saving}
                                            onClick={() => quickToggleRedeemed(row, !row.status?.has_redeemed)}
                                        >
                                            {row.status?.has_redeemed ? 'Unset Redeemed' : 'Set Redeemed'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!loading && rows.length === 0 ? (
                            <tr>
                                <td colSpan={7}>Tidak ada data member untuk filter ini.</td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>

            <div className="votes-monitor-pagination" style={{ justifyContent: 'space-between', marginTop: 12 }}>
                <span>Total {total} member</span>
                <div className="admin-chip-list">
                    <button
                        type="button"
                        className="secondary"
                        onClick={() => loadMembers(Math.max(1, page - 1))}
                        disabled={loading || page <= 1}
                    >
                        Sebelumnya
                    </button>
                    <span style={{ alignSelf: 'center' }}>Halaman {page} / {lastPage}</span>
                    <button
                        type="button"
                        className="secondary"
                        onClick={() => loadMembers(Math.min(lastPage, page + 1))}
                        disabled={loading || page >= lastPage}
                    >
                        Berikutnya
                    </button>
                </div>
            </div>

            {showModal ? (
                <div className="admin-modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="admin-modal-card admin-modal-card--wide" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>{editingId ? `Edit Member #${editingId}` : 'Tambah Member Baru'}</h3>
                            <button type="button" className="admin-modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <form className="admin-auth-form" onSubmit={handleSubmit}>
                            <label>
                                NIK
                                <input
                                    value={form.nik}
                                    onChange={(e) => updateForm('nik', e.target.value)}
                                    maxLength={20}
                                    required
                                />
                            </label>

                            <label>
                                Nama
                                <input
                                    value={form.name}
                                    onChange={(e) => updateForm('name', e.target.value)}
                                    required
                                />
                            </label>

                            <label>
                                Email
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => updateForm('email', e.target.value)}
                                />
                            </label>

                            <label>
                                Site (legacy text)
                                <input
                                    value={form.site}
                                    onChange={(e) => updateForm('site', e.target.value)}
                                    placeholder="contoh: Site A"
                                />
                            </label>

                            <label>
                                Department (legacy text)
                                <input
                                    value={form.department}
                                    onChange={(e) => updateForm('department', e.target.value)}
                                />
                            </label>

                            <label>
                                Department ID (FK)
                                <input
                                    type="number"
                                    value={form.department_id}
                                    onChange={(e) => updateForm('department_id', e.target.value)}
                                    min={1}
                                />
                            </label>

                            <label>
                                Nomor GoPay
                                <input
                                    value={form.gopay_number}
                                    onChange={(e) => updateForm('gopay_number', e.target.value)}
                                    placeholder="08xxxxxxxxxx"
                                />
                            </label>

                            <label>
                                Nomor Owner GoPay (jika bukan sendiri)
                                <input
                                    value={form.gopay_owner_number}
                                    onChange={(e) => updateForm('gopay_owner_number', e.target.value)}
                                    placeholder="08xxxxxxxxxx"
                                />
                            </label>

                            <label>
                                GoPay milik sendiri?
                                <select
                                    value={form.is_gopay_owner_self ? '1' : '0'}
                                    onChange={(e) => updateForm('is_gopay_owner_self', e.target.value === '1')}
                                >
                                    <option value="1">Ya</option>
                                    <option value="0">Tidak</option>
                                </select>
                            </label>

                            <label>
                                Eligible
                                <select
                                    value={form.is_eligible ? '1' : '0'}
                                    onChange={(e) => updateForm('is_eligible', e.target.value === '1')}
                                >
                                    <option value="1">Ya</option>
                                    <option value="0">Tidak</option>
                                </select>
                            </label>

                            <label>
                                Sudah Vote
                                <select
                                    value={form.has_voted ? '1' : '0'}
                                    onChange={(e) => updateForm('has_voted', e.target.value === '1')}
                                >
                                    <option value="1">Ya</option>
                                    <option value="0">Tidak</option>
                                </select>
                            </label>

                            <div className="admin-chip-list">
                                <button className="btn btn-primary" type="submit" disabled={saving}>
                                    {saving ? 'Menyimpan...' : editingId ? 'Update Member' : 'Tambah Member'}
                                </button>
                                <button className="btn btn-secondary" type="button" onClick={() => setShowModal(false)} disabled={saving}>
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
