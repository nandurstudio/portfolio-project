import { FormEvent, useEffect, useState } from 'react'
import { authApi, electionApi } from '../services/api'
import '../styles/pages/admin-landing-setup.css'
import { setStoredAdminUser } from '../components/admin/authStorage'
import { notify } from '../utils/notify'

type ElectionPayload = {
    election_name: string
    period: string
    start_date: string
    end_date: string
    end_time: string
    announcement_at: string
    is_active: boolean
    is_finalized: boolean
    hero_title: string
    hero_description: string
    cta_text: string
    agenda_title: string
    agenda_description: string
    agenda_location: string
    show_countdown: boolean
    show_activity_log: boolean
    reward_enabled: boolean
    reward_text: string
    seo_title: string
    seo_description: string
    og_title: string
    og_description: string
    og_image_url: string
    canonical_url: string
}

const normalizeTime = (value?: string | null) => {
    if (!value) return '17:00'
    return value.slice(0, 5)
}

const normalizeDateTimeLocal = (value?: string | null) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const pad = (v: number) => `${v}`.padStart(2, '0')
    const y = date.getFullYear()
    const m = pad(date.getMonth() + 1)
    const d = pad(date.getDate())
    const h = pad(date.getHours())
    const i = pad(date.getMinutes())
    return `${y}-${m}-${d}T${h}:${i}`
}

export default function AdminLandingSetupPage() {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [loggingIn, setLoggingIn] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const [tokenInput, setTokenInput] = useState(localStorage.getItem('admin_token') ?? '')
    const [form, setForm] = useState<ElectionPayload>({
        election_name: '',
        period: '',
        start_date: '',
        end_date: '',
        end_time: '17:00',
        announcement_at: '',
        is_active: true,
        is_finalized: false,
        hero_title: 'SUARAKAN ASPIRASIMU!',
        hero_description: 'Mari sukseskan Pemilihan Ketua Koperasi Karya Mandiri periode 2026-2029. Jangan sampai golput, karena arah koperasi kita ditentukan oleh suara seluruh anggota.',
        cta_text: 'Lanjut Verifikasi OTP',
        agenda_title: 'Pemilihan Ketua Koperasi Karya Mandiri 2026-2029',
        agenda_description: 'Agenda pemilihan ketua koperasi periode 2026-2029.',
        agenda_location: '',
        show_countdown: true,
        show_activity_log: true,
        reward_enabled: true,
        reward_text: 'Voucher GoPay senilai Rp25.000',
        seo_title: '',
        seo_description: '',
        og_title: '',
        og_description: '',
        og_image_url: '',
        canonical_url: '',
    })

    const loadData = async () => {
        setLoading(true)

        try {
            const res = await electionApi.current()
            const data = res?.data?.data ?? {}

            setForm({
                election_name: data.election_name ?? '',
                period: data.period ?? '',
                start_date: data.start_date ?? '',
                end_date: data.end_date ?? '',
                end_time: normalizeTime(data.end_time),
                announcement_at: normalizeDateTimeLocal(data.announcement_at),
                is_active: Boolean(data.is_active),
                is_finalized: Boolean(data.is_finalized),
                hero_title: data.hero_title ?? 'SUARAKAN ASPIRASIMU!',
                hero_description: data.hero_description ?? 'Mari sukseskan Pemilihan Ketua Koperasi Karya Mandiri periode 2026-2029. Jangan sampai golput, karena arah koperasi kita ditentukan oleh suara seluruh anggota.',
                cta_text: data.cta_text ?? 'Lanjut Verifikasi OTP',
                agenda_title: data.agenda_title ?? data.election_name ?? 'Pemilihan Ketua Koperasi Karya Mandiri 2026-2029',
                agenda_description: data.agenda_description ?? 'Agenda pemilihan ketua koperasi periode 2026-2029.',
                agenda_location: data.agenda_location ?? '',
                show_countdown: data.show_countdown ?? true,
                show_activity_log: data.show_activity_log ?? true,
                reward_enabled: data.reward_enabled ?? true,
                reward_text: data.reward_text ?? 'Voucher GoPay senilai Rp25.000',
                seo_title: data.seo_title ?? '',
                seo_description: data.seo_description ?? '',
                og_title: data.og_title ?? '',
                og_description: data.og_description ?? '',
                og_image_url: data.og_image_url ?? '',
                canonical_url: data.canonical_url ?? '',
            })
        } catch (e: any) {
            notify.error('Load Pengaturan Gagal', e?.response?.data?.message ?? 'Gagal memuat pengaturan landing page')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const saveToken = () => {
        if (!tokenInput.trim()) {
            localStorage.removeItem('admin_token')
            notify.info('Token Dihapus', 'Admin token dihapus dari browser')
            return
        }

        localStorage.setItem('admin_token', tokenInput.trim())
        notify.success('Token Tersimpan', 'Admin token tersimpan di browser')
    }

    const loginAdmin = async (e: FormEvent) => {
        e.preventDefault()
        setLoggingIn(true)

        try {
            const res = await authApi.adminLogin(username, password)
            const token = res?.data?.token
            const user = res?.data?.user

            if (!token) {
                throw new Error('Token login admin tidak ditemukan')
            }

            localStorage.setItem('admin_token', token)
            localStorage.setItem('token', token)
            if (user) {
                setStoredAdminUser(user)
            }
            setTokenInput(token)
            notify.success('Login Berhasil', 'Token siap dipakai untuk simpan pengaturan.')
        } catch (err: any) {
            notify.error('Login Admin Gagal', err?.response?.data?.message ?? err?.message ?? 'Login admin gagal')
        } finally {
            setLoggingIn(false)
        }
    }

    const submit = async (e: FormEvent) => {
        e.preventDefault()
        setSaving(true)

        // Apply token input immediately for this submit flow.
        if (tokenInput.trim()) {
            localStorage.setItem('admin_token', tokenInput.trim())
        }

        try {
            await electionApi.update({
                ...form,
                end_time: form.end_time.length === 5 ? `${form.end_time}:00` : form.end_time,
                announcement_at: form.announcement_at ? new Date(form.announcement_at).toISOString() : null,
            })
            notify.success('Berhasil', 'Pengaturan landing page berhasil disimpan')
            await loadData()
        } catch (err: any) {
            notify.error('Simpan Pengaturan Gagal', err?.response?.data?.message ?? 'Gagal menyimpan pengaturan')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="landing-setup-page">
            <header className="landing-setup-header">
                <h1>Admin Setup Landing Page</h1>
                <p>Kelola jadwal voting, hero section, CTA, bonus, serta metadata SEO dari satu dashboard.</p>
            </header>

            <section className="setup-card">
                <h2>Autentikasi Admin</h2>
                <p className="setup-subtitle">Login sekali untuk mendapatkan JWT token, lalu simpan token di browser ini.</p>

                <form onSubmit={loginAdmin} className="setup-grid setup-grid-auth">
                    <label className="setup-field">
                        <span>Username</span>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </label>
                    <label className="setup-field">
                        <span>Password</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>
                    <button type="submit" className="setup-btn" disabled={loggingIn}>
                        {loggingIn ? 'Login...' : 'Login Admin'}
                    </button>
                </form>

                <label className="setup-field" style={{ marginTop: 12 }}>
                    <span>Admin JWT Token</span>
                    <textarea
                        rows={3}
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        placeholder="Paste token dari endpoint /api/auth/admin/login"
                    />
                </label>
                <button type="button" className="setup-btn setup-btn-secondary" onClick={saveToken}>Simpan Token</button>
            </section>

            {loading ? <p className="setup-info">Memuat data...</p> : null}

            <form onSubmit={submit} className="setup-form-wrap">
                <section className="setup-card">
                    <h2>Jadwal & Status</h2>
                    <div className="setup-grid setup-grid-3">
                        <label className="setup-field">
                            <span>Judul Agenda Internal</span>
                            <input
                                value={form.election_name}
                                onChange={(e) => setForm((s) => ({ ...s, election_name: e.target.value }))}
                                required
                            />
                        </label>
                        <label className="setup-field">
                            <span>Periode</span>
                            <input
                                value={form.period}
                                onChange={(e) => setForm((s) => ({ ...s, period: e.target.value }))}
                                placeholder="contoh: 2026-2029"
                            />
                        </label>
                        <label className="setup-field">
                            <span>Jam Selesai</span>
                            <input
                                type="time"
                                value={form.end_time}
                                onChange={(e) => setForm((s) => ({ ...s, end_time: e.target.value }))}
                            />
                        </label>
                    </div>

                    <div className="setup-grid setup-grid-3">
                        <label className="setup-field">
                            <span>Tanggal Mulai</span>
                            <input
                                type="date"
                                value={form.start_date}
                                onChange={(e) => setForm((s) => ({ ...s, start_date: e.target.value }))}
                            />
                        </label>
                        <label className="setup-field">
                            <span>Tanggal Selesai</span>
                            <input
                                type="date"
                                value={form.end_date}
                                onChange={(e) => setForm((s) => ({ ...s, end_date: e.target.value }))}
                            />
                        </label>
                        <label className="setup-field">
                            <span>Waktu Pengumuman</span>
                            <input
                                type="datetime-local"
                                value={form.announcement_at}
                                onChange={(e) => setForm((s) => ({ ...s, announcement_at: e.target.value }))}
                            />
                        </label>
                    </div>

                    <div className="setup-toggle-grid">
                        <label className="setup-toggle">
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))}
                            />
                            <span>Aktifkan voting (is_active)</span>
                        </label>
                        <label className="setup-toggle">
                            <input
                                type="checkbox"
                                checked={form.is_finalized}
                                onChange={(e) => setForm((s) => ({ ...s, is_finalized: e.target.checked }))}
                            />
                            <span>Finalisasi hasil (is_finalized)</span>
                        </label>
                        <label className="setup-toggle">
                            <input
                                type="checkbox"
                                checked={form.show_countdown}
                                onChange={(e) => setForm((s) => ({ ...s, show_countdown: e.target.checked }))}
                            />
                            <span>Tampilkan countdown</span>
                        </label>
                        <label className="setup-toggle">
                            <input
                                type="checkbox"
                                checked={form.show_activity_log}
                                onChange={(e) => setForm((s) => ({ ...s, show_activity_log: e.target.checked }))}
                            />
                            <span>Tampilkan activity log (landing)</span>
                        </label>
                    </div>
                </section>

                <section className="setup-card">
                    <h2>Konten Hero & CTA</h2>
                    <div className="setup-grid">
                        <label className="setup-field">
                            <span>Hero Title</span>
                            <input
                                value={form.hero_title}
                                onChange={(e) => setForm((s) => ({ ...s, hero_title: e.target.value }))}
                            />
                        </label>
                        <label className="setup-field">
                            <span>Teks Tombol CTA</span>
                            <input
                                value={form.cta_text}
                                onChange={(e) => setForm((s) => ({ ...s, cta_text: e.target.value }))}
                            />
                        </label>
                        <label className="setup-field">
                            <span>Deskripsi Hero</span>
                            <textarea
                                rows={4}
                                value={form.hero_description}
                                onChange={(e) => setForm((s) => ({ ...s, hero_description: e.target.value }))}
                            />
                        </label>
                    </div>
                </section>

                <section className="setup-card">
                    <h2>Agenda & Bonus</h2>
                    <div className="setup-grid">
                        <label className="setup-field">
                            <span>Judul Agenda (Landing)</span>
                            <input
                                value={form.agenda_title}
                                onChange={(e) => setForm((s) => ({ ...s, agenda_title: e.target.value }))}
                            />
                        </label>
                        <label className="setup-field">
                            <span>Lokasi Agenda</span>
                            <input
                                value={form.agenda_location}
                                onChange={(e) => setForm((s) => ({ ...s, agenda_location: e.target.value }))}
                                placeholder="contoh: Aula KKM Site A"
                            />
                        </label>
                        <label className="setup-field">
                            <span>Deskripsi Agenda</span>
                            <textarea
                                rows={3}
                                value={form.agenda_description}
                                onChange={(e) => setForm((s) => ({ ...s, agenda_description: e.target.value }))}
                            />
                        </label>
                    </div>

                    <div className="setup-toggle-grid">
                        <label className="setup-toggle">
                            <input
                                type="checkbox"
                                checked={form.reward_enabled}
                                onChange={(e) => setForm((s) => ({ ...s, reward_enabled: e.target.checked }))}
                            />
                            <span>Aktifkan informasi bonus pemilih</span>
                        </label>
                    </div>

                    <label className="setup-field">
                        <span>Teks Bonus</span>
                        <input
                            value={form.reward_text}
                            onChange={(e) => setForm((s) => ({ ...s, reward_text: e.target.value }))}
                        />
                    </label>
                </section>

                <section className="setup-card">
                    <h2>SEO & Open Graph</h2>
                    <div className="setup-grid setup-grid-2">
                        <label className="setup-field">
                            <span>SEO Title</span>
                            <input
                                value={form.seo_title}
                                onChange={(e) => setForm((s) => ({ ...s, seo_title: e.target.value }))}
                            />
                        </label>
                        <label className="setup-field">
                            <span>Canonical URL</span>
                            <input
                                value={form.canonical_url}
                                onChange={(e) => setForm((s) => ({ ...s, canonical_url: e.target.value }))}
                                placeholder="https://kkmsmartvote.web.id"
                            />
                        </label>
                        <label className="setup-field">
                            <span>SEO Description</span>
                            <textarea
                                rows={3}
                                value={form.seo_description}
                                onChange={(e) => setForm((s) => ({ ...s, seo_description: e.target.value }))}
                            />
                        </label>
                        <label className="setup-field">
                            <span>OG Image URL</span>
                            <input
                                value={form.og_image_url}
                                onChange={(e) => setForm((s) => ({ ...s, og_image_url: e.target.value }))}
                            />
                        </label>
                        <label className="setup-field">
                            <span>OG Title</span>
                            <input
                                value={form.og_title}
                                onChange={(e) => setForm((s) => ({ ...s, og_title: e.target.value }))}
                            />
                        </label>
                        <label className="setup-field">
                            <span>OG Description</span>
                            <textarea
                                rows={3}
                                value={form.og_description}
                                onChange={(e) => setForm((s) => ({ ...s, og_description: e.target.value }))}
                            />
                        </label>
                    </div>
                </section>

                <div className="setup-actions">
                    <button type="submit" className="setup-btn" disabled={saving}>
                        {saving ? 'Menyimpan...' : 'Simpan Pengaturan Landing'}
                    </button>
                </div>
            </form>
        </div>
    )
}
