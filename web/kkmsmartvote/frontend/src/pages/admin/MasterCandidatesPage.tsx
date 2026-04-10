import { useEffect, useMemo, useRef, useState } from 'react'
import { candidatesApi, membersApi, votingApi } from '../../services/api'

type CandidateRow = {
    id: number
    name: string
    nik?: string | null
    position?: string | null
    department_name?: string | null
    site_name?: string | null
    vision?: string | null
    mission?: string | null
    vision_mission?: string | null
    motto?: string | null
    photo_url?: string | null
    full_photo_url?: string | null
    order_display?: number | null
    is_active: boolean
}

type CandidateForm = {
    name: string
    nik: string
    position: string
    department_name: string
    site_name: string
    vision: string
    mission: string
    motto: string
    photo_url: string
    order_display: string
    is_active: boolean
}

type SiteOption = {
    id: number
    code?: string
    name: string
}

const emptyForm: CandidateForm = {
    name: '-',
    nik: '',
    position: 'Calon Ketua KKM',
    department_name: '-',
    site_name: '-',
    vision: '',
    mission: '',
    motto: '',
    photo_url: '',
    order_display: '',
    is_active: true,
}

export default function MasterCandidatesPage() {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [uploadingPhoto, setUploadingPhoto] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [rows, setRows] = useState<CandidateRow[]>([])
    const [editId, setEditId] = useState<number | null>(null)
    const [form, setForm] = useState<CandidateForm>(emptyForm)
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState('')
    const [fetchingNik, setFetchingNik] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [siteOptions, setSiteOptions] = useState<SiteOption[]>([])
    const [loadingSites, setLoadingSites] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [page, setPage] = useState(1)
    const [perPage] = useState(8)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const title = useMemo(() => {
        return editId ? `Edit Kandidat #${editId}` : 'Tambah Kandidat'
    }, [editId])

    const loadCandidates = async () => {
        const res = await candidatesApi.adminIndex()
        const data = Array.isArray(res?.data?.data) ? res.data.data : []
        const sorted = [...data].sort((a, b) => {
            const oa = Number(a?.order_display ?? 99999)
            const ob = Number(b?.order_display ?? 99999)
            if (oa !== ob) return oa - ob
            return Number(a?.id ?? 0) - Number(b?.id ?? 0)
        })
        setRows(sorted)
    }

    const loadSites = async () => {
        setLoadingSites(true)
        try {
            const res = await votingApi.sites()
            const list = Array.isArray(res?.data?.data) ? res.data.data : []
            setSiteOptions(list)
        } catch {
            setSiteOptions([])
        } finally {
            setLoadingSites(false)
        }
    }

    useEffect(() => {
        // Ensure uploader state is fresh when entering/reloading page.
        setUploadingPhoto(false)
        setUploadProgress(0)

        const load = async () => {
            setLoading(true)
            setError('')
            try {
                await Promise.all([loadCandidates(), loadSites()])
            } catch (err: any) {
                setError(err?.response?.data?.message || 'Gagal memuat data kandidat')
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [])

    const clearSelectedPhotoFile = () => {
        setPhotoFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const resetForm = () => {
        setEditId(null)
        setForm(emptyForm)
        clearSelectedPhotoFile()
        setPhotoPreview('')
        setUploadProgress(0)
        setUploadingPhoto(false)
    }

    const openCreateModal = () => {
        resetForm()
        setError('')
        setSuccess('')
        setShowModal(true)
    }

    const handleChange = <K extends keyof CandidateForm>(key: K, value: CandidateForm[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const startEdit = (row: CandidateRow) => {
        setEditId(row.id)
        setError('')
        setSuccess('')
        setForm({
            name: row.name || '',
            nik: row.nik || '',
            position: row.position || 'Calon Ketua KKM',
            department_name: row.department_name || '',
            site_name: row.site_name || '',
            vision: row.vision || '',
            mission: row.mission || '',
            motto: row.motto || '',
            photo_url: row.full_photo_url || row.photo_url || '',
            order_display:
                row.order_display === null || row.order_display === undefined
                    ? ''
                    : String(row.order_display),
            is_active: Boolean(row.is_active),
        })
        clearSelectedPhotoFile()
        setPhotoPreview(row.full_photo_url || row.photo_url || '')
        setUploadProgress(0)
        setUploadingPhoto(false)
        setShowModal(true)
    }

    const handleLookupNik = async () => {
        const nik = form.nik.trim()
        if (!nik) {
            setError('NIK wajib diisi untuk mengambil data anggota.')
            return
        }

        setError('')
        setSuccess('')
        setFetchingNik(true)

        try {
            const res = await membersApi.byNik(nik)
            const member = res?.data?.data || {}
            const memberDepartment =
                typeof member.department === 'string'
                    ? member.department
                    : member.department?.name || '-'
            const memberSite =
                typeof member.site === 'string'
                    ? member.site
                    : member.site?.name || '-'

            setForm((prev) => ({
                ...prev,
                nik: String(member.nik || nik).toUpperCase(),
                name: String(member.name || '-'),
                department_name: String(memberDepartment || '-'),
                site_name: String(memberSite || '-'),
            }))

            setSuccess('Data anggota berhasil ditarik berdasarkan NIK.')
        } catch (err: any) {
            setError(err?.response?.data?.message || 'NIK tidak ditemukan di data anggota')
        } finally {
            setFetchingNik(false)
        }
    }

    const saveCandidate = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        const payload = {
            name: form.name.trim() || null,
            nik: form.nik.trim() || null,
            position: form.position.trim() || 'Calon Ketua KKM',
            department_name: form.department_name.trim() || null,
            site_name: form.site_name.trim() || null,
            vision: form.vision.trim() || null,
            mission: form.mission.trim() || null,
            vision_mission: [form.vision.trim(), form.mission.trim()].filter(Boolean).join('\n\n') || null,
            motto: form.motto.trim() || null,
            full_photo_url: form.photo_url.trim() || null,
            photo_url: form.photo_url.trim() || null,
            order_display:
                form.order_display.trim() === '' ? null : Number.parseInt(form.order_display.trim(), 10),
            is_active: form.is_active,
        }

        if (!payload.nik) {
            setError('NIK kandidat wajib diisi.')
            return
        }

        setSaving(true)
        try {
            if (editId) {
                await candidatesApi.update(editId, payload)
                setSuccess('Kandidat berhasil diupdate.')
            } else {
                await candidatesApi.store(payload)
                setSuccess('Kandidat baru berhasil ditambahkan.')
            }

            await loadCandidates()
            resetForm()
        } catch (err: any) {
            const validationErrors = err?.response?.data?.errors
            if (validationErrors && typeof validationErrors === 'object') {
                const firstKey = Object.keys(validationErrors)[0]
                const firstMessage = Array.isArray(validationErrors[firstKey])
                    ? validationErrors[firstKey][0]
                    : null
                setError(firstMessage || err?.response?.data?.message || 'Validasi kandidat gagal')
            } else {
                setError(err?.response?.data?.message || 'Gagal menyimpan kandidat')
            }
        } finally {
            setSaving(false)
        }
    }

    const handleUploadPhoto = async () => {
        if (!editId) {
            setError('Simpan kandidat dulu, lalu upload foto saat mode edit.')
            return
        }
        if (!photoFile) {
            setError('Pilih file foto terlebih dahulu.')
            return
        }

        setError('')
        setSuccess('')
        setUploadingPhoto(true)
        setUploadProgress(0)

        const uploadGuard = setTimeout(() => {
            setUploadingPhoto(false)
            setUploadProgress(0)
            setError('Upload timeout. Silakan coba lagi dengan file lebih kecil atau cek koneksi backend.')
        }, 50000)

        try {
            const res = await candidatesApi.uploadPhoto(editId, photoFile, (percent) => {
                setUploadProgress(percent)
            })
            const nextPhotoUrl =
                res?.data?.data?.full_photo_url ||
                res?.data?.data?.photo_url ||
                photoPreview

            setForm((prev) => ({ ...prev, photo_url: nextPhotoUrl || prev.photo_url }))
            setPhotoPreview(nextPhotoUrl || photoPreview)
            setUploadProgress(100)
            clearSelectedPhotoFile()
            setSuccess('Foto kandidat berhasil diupload.')
            await loadCandidates()
            // Briefly show 100%, then reset progress state.
            setTimeout(() => setUploadProgress(0), 500)
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Gagal upload foto kandidat')
            setUploadProgress(0)
        } finally {
            clearTimeout(uploadGuard)
            setUploadingPhoto(false)
        }
    }

    const handleDeactivate = async (row: CandidateRow) => {
        setError('')
        setSuccess('')

        const ok = window.confirm(`Nonaktifkan kandidat ${row.name}?`)
        if (!ok) return

        setSaving(true)
        try {
            await candidatesApi.destroy(row.id)
            setSuccess('Kandidat berhasil dinonaktifkan.')
            await loadCandidates()

            if (editId === row.id) {
                resetForm()
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Gagal menonaktifkan kandidat')
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
            <h2>Master Kandidat</h2>
            <p>
                Setup kandidat berbasis NIK: isi NIK lalu tarik data anggota. Nama, department, dan site akan mengikuti data member.
                Anda hanya perlu melengkapi data kampanye seperti posisi, urutan, visi, misi, motto, dan foto.
            </p>

            {loading ? <p>Memuat kandidat...</p> : null}
            {error ? <p className="admin-error">{error}</p> : null}
            {success ? <p className="admin-success">{success}</p> : null}

            <div className="admin-chip-list" style={{ marginBottom: 12 }}>
                <button type="button" className="btn btn-primary" onClick={openCreateModal}>
                    + Tambah Kandidat
                </button>
            </div>

            <div className="admin-table-wrap" style={{ marginTop: 16 }}>
                <table className="admin-table admin-table--mobile-friendly">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Foto</th>
                            <th>Urut</th>
                            <th>Nama</th>
                            <th>NIK</th>
                            <th>Site</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagedRows.map((row) => (
                            <tr key={row.id}>
                                <td data-label="ID">{row.id}</td>
                                <td data-label="Foto">
                                    {row.full_photo_url || row.photo_url ? (
                                        <img
                                            src={row.full_photo_url || row.photo_url || ''}
                                            alt={row.name}
                                            className="admin-table-thumb"
                                        />
                                    ) : (
                                        <div className="admin-table-thumb admin-table-thumb--empty">N/A</div>
                                    )}
                                </td>
                                <td data-label="Urut">{row.order_display ?? '-'}</td>
                                <td data-label="Nama">{row.name}</td>
                                <td data-label="NIK">{row.nik || '-'}</td>
                                <td data-label="Site">{row.site_name || '-'}</td>
                                <td data-label="Status">{row.is_active ? 'Aktif' : 'Tidak Aktif'}</td>
                                <td data-label="Aksi">
                                    <div className="admin-chip-list">
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={() => startEdit(row)}
                                            disabled={saving}
                                        >
                                            Edit
                                        </button>
                                        {row.is_active ? (
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => handleDeactivate(row)}
                                                disabled={saving}
                                            >
                                                Nonaktifkan
                                            </button>
                                        ) : null}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!loading && pagedRows.length === 0 ? (
                            <tr>
                                <td colSpan={8}>Belum ada data kandidat.</td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>

            <div className="votes-monitor-pagination" style={{ justifyContent: 'space-between', marginTop: 12 }}>
                <span>Total {rows.length} kandidat</span>
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
                <div className="admin-modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="admin-modal-card admin-modal-card--wide" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>{title}</h3>
                            <button type="button" className="admin-modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <form className="admin-auth-form" onSubmit={saveCandidate}>
                            <label>
                                NIK
                                <input
                                    value={form.nik}
                                    onChange={(e) => handleChange('nik', e.target.value.toUpperCase())}
                                    placeholder="Contoh: 3024"
                                    required
                                />
                            </label>

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleLookupNik}
                                disabled={fetchingNik || saving || uploadingPhoto}
                            >
                                {fetchingNik ? 'Mengambil Data NIK...' : 'Tarik Data Anggota dari NIK'}
                            </button>

                            <label>
                                Nama Kandidat (otomatis dari NIK)
                                <input
                                    value={form.name}
                                    readOnly
                                />
                            </label>

                            <label>
                                Posisi
                                <input
                                    value={form.position}
                                    onChange={(e) => handleChange('position', e.target.value)}
                                    placeholder="Contoh: Calon Ketua KKM"
                                />
                            </label>

                            <label>
                                Department (otomatis)
                                <input
                                    value={form.department_name}
                                    readOnly
                                />
                            </label>

                            <label>
                                Site
                                <select
                                    value={form.site_name}
                                    onChange={(e) => handleChange('site_name', e.target.value)}
                                    disabled={loadingSites || saving || uploadingPhoto || fetchingNik}
                                >
                                    <option value="">{loadingSites ? 'Memuat site...' : 'Pilih site'}</option>
                                    {siteOptions.map((site) => (
                                        <option key={site.id} value={site.name}>
                                            {site.name}
                                        </option>
                                    ))}
                                    {form.site_name && !siteOptions.some((site) => site.name === form.site_name) ? (
                                        <option value={form.site_name}>{form.site_name}</option>
                                    ) : null}
                                </select>
                            </label>

                            <label>
                                Visi
                                <textarea
                                    value={form.vision}
                                    onChange={(e) => handleChange('vision', e.target.value)}
                                    rows={3}
                                    placeholder="Visi kandidat"
                                />
                            </label>

                            <label>
                                Misi
                                <textarea
                                    value={form.mission}
                                    onChange={(e) => handleChange('mission', e.target.value)}
                                    rows={3}
                                    placeholder="Misi kandidat"
                                />
                            </label>

                            <label>
                                Motto
                                <input
                                    value={form.motto}
                                    onChange={(e) => handleChange('motto', e.target.value)}
                                    placeholder="Contoh: Bersama, Transparan, Maju"
                                />
                            </label>

                            <label>
                                URL Foto
                                <input
                                    value={form.photo_url}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        handleChange('photo_url', value)
                                        setPhotoPreview(value)
                                    }}
                                    placeholder="https://..."
                                />
                            </label>

                            <label>
                                Upload Foto (JPG/PNG)
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg,image/gif"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null
                                        if (photoPreview.startsWith('blob:')) {
                                            URL.revokeObjectURL(photoPreview)
                                        }
                                        setPhotoFile(file)
                                        if (file) {
                                            const objectUrl = URL.createObjectURL(file)
                                            setPhotoPreview(objectUrl)
                                            setUploadProgress(0)
                                        } else {
                                            setUploadProgress(0)
                                        }
                                    }}
                                />
                            </label>

                            {photoPreview ? (
                                <div className="admin-candidate-photo-preview-wrap">
                                    <img src={photoPreview} alt="Preview kandidat" className="admin-candidate-photo-preview" />
                                </div>
                            ) : null}

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleUploadPhoto}
                                disabled={!editId || !photoFile || uploadingPhoto || saving}
                            >
                                {uploadingPhoto ? 'Uploading Foto...' : 'Upload Foto Kandidat'}
                            </button>

                            {uploadingPhoto || uploadProgress > 0 ? (
                                <div className="admin-upload-progress-wrap" aria-live="polite">
                                    <div className="admin-upload-progress-track">
                                        <div
                                            className="admin-upload-progress-bar"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <p className="admin-upload-progress-text">Upload: {uploadProgress}%</p>
                                </div>
                            ) : null}

                            <label>
                                Urutan Tampil
                                <input
                                    type="number"
                                    value={form.order_display}
                                    onChange={(e) => handleChange('order_display', e.target.value)}
                                    placeholder="1"
                                    min={0}
                                />
                            </label>

                            <label>
                                Status Aktif
                                <select
                                    value={form.is_active ? '1' : '0'}
                                    onChange={(e) => handleChange('is_active', e.target.value === '1')}
                                >
                                    <option value="1">Aktif</option>
                                    <option value="0">Tidak Aktif</option>
                                </select>
                            </label>

                            <div className="admin-chip-list">
                                <button className="btn btn-primary" type="submit" disabled={saving}>
                                    {saving ? 'Menyimpan...' : editId ? 'Update Kandidat' : 'Tambah Kandidat'}
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
