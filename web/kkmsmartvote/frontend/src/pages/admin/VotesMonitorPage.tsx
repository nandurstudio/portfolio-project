import { useEffect, useMemo, useState } from 'react'
import { adminApi } from '../../services/api'
import { notify } from '../../utils/notify'

type AuditItem = {
    id: number
    actor: string
    action: string
    detail?: Record<string, any>
    ip_address?: string | null
    logged_at: string
}

type ActionSummary = {
    action: string
    total: number
}

type PaginationState = {
    current_page: number
    last_page: number
    total: number
}

type ForensicWindow = {
    window_first_hash?: string | null
    window_last_hash?: string | null
}

const ACTION_OPTIONS = [
    '',
    'Login',
    'Login Gagal',
    'Logout',
    'OTP Diminta',
    'OTP Terverifikasi',
    'OTP Verifikasi Ditolak',
    'Vote Dikirim',
    'Vote Ditolak',
    'Klaim Voucher Berhasil',
    'Klaim Voucher Ditolak',
]

function shortHash(value?: string | null): string {
    if (!value) return '-'
    if (value.length <= 16) return value
    return `${value.slice(0, 10)}...${value.slice(-6)}`
}

export default function VotesMonitorPage() {
    const [logs, setLogs] = useState<AuditItem[]>([])
    const [loading, setLoading] = useState(false)

    const [action, setAction] = useState('')
    const [actor, setActor] = useState('')
    const [keyword, setKeyword] = useState('')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [page, setPage] = useState(1)

    const [summary, setSummary] = useState<ActionSummary[]>([])
    const [forensic, setForensic] = useState<ForensicWindow>({})
    const [pagination, setPagination] = useState<PaginationState>({
        current_page: 1,
        last_page: 1,
        total: 0,
    })

    const fetchAudit = async () => {
        setLoading(true)
        try {
            const res = await adminApi.auditLogs({
                action: action || undefined,
                actor: actor || undefined,
                q: keyword || undefined,
                from: fromDate || undefined,
                to: toDate || undefined,
                per_page: 50,
                page,
            })

            const payload = res?.data || {}
            setLogs(Array.isArray(payload.data) ? payload.data : [])
            setPagination({
                current_page: Number(payload.current_page || 1),
                last_page: Number(payload.last_page || 1),
                total: Number(payload.total || 0),
            })

            const actionRows = payload?.summary?.actions
            setSummary(Array.isArray(actionRows) ? actionRows : [])
            setForensic(payload?.summary?.forensic || {})
        } catch {
            setLogs([])
            setSummary([])
            setForensic({})
            notify.error('Load Audit Log Gagal', 'Pastikan API admin aktif.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAudit()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page])

    const totalFilteredEvents = pagination.total
    const uniqueActors = useMemo(() => {
        const actorSet = new Set(logs.map((item) => String(item.actor || '-')))
        return actorSet.size
    }, [logs])

    const latestEventAt = logs.length > 0
        ? new Date(logs[0].logged_at).toLocaleString('id-ID')
        : '-'

    return (
        <div className="admin-page-grid">
            <section className="admin-simple-card">
                <h2>Monitoring Vote & Audit Forensik</h2>
                <p>
                    Dashboard ini menampilkan jejak aktivitas digital untuk saksi: login, OTP, voting, klaim voucher, logout,
                    dan event operasional lain yang tercatat berantai.
                </p>

                <div className="admin-chip-list votes-monitor-kpis">
                    <span className="admin-chip">Total Event (Filter): {totalFilteredEvents}</span>
                    <span className="admin-chip">Actor Unik (Halaman ini): {uniqueActors}</span>
                    <span className="admin-chip">Event Terbaru: {latestEventAt}</span>
                </div>

                <div className="votes-monitor-forensic">
                    <strong>Forensic Chain (window)</strong>
                    <p>First Hash: {shortHash(forensic.window_first_hash)}</p>
                    <p>Last Hash: {shortHash(forensic.window_last_hash)}</p>
                </div>
            </section>

            <section className="admin-simple-card">
                <h2>Filter Aktivitas</h2>
                <div className="votes-monitor-filters">
                    <label>
                        Aktivitas
                        <select value={action} onChange={(e) => setAction(e.target.value)}>
                            {ACTION_OPTIONS.map((item) => (
                                <option key={item || 'all'} value={item}>{item || 'Semua Aktivitas'}</option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Actor
                        <input
                            type="text"
                            value={actor}
                            onChange={(e) => setActor(e.target.value)}
                            placeholder="contoh: Admin, Panitia, Guest"
                        />
                    </label>

                    <label>
                        Kata Kunci
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="cari actor/action"
                        />
                    </label>

                    <label>
                        Dari Tanggal
                        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                    </label>

                    <label>
                        Sampai Tanggal
                        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    </label>
                </div>

                <div className="votes-monitor-actions">
                    <button
                        type="button"
                        onClick={() => {
                            setPage(1)
                            fetchAudit()
                        }}
                    >
                        Terapkan Filter
                    </button>
                    <button
                        type="button"
                        className="secondary"
                        onClick={() => {
                            setAction('')
                            setActor('')
                            setKeyword('')
                            setFromDate('')
                            setToDate('')
                            setPage(1)
                            setTimeout(fetchAudit, 0)
                        }}
                    >
                        Reset
                    </button>
                </div>
            </section>

            <section className="admin-simple-card">
                <h2>Ringkasan Aktivitas (Filtered)</h2>
                <div className="admin-chip-list">
                    {summary.length > 0 ? summary.map((item) => (
                        <span className="admin-chip" key={item.action}>{item.action}: {item.total}</span>
                    )) : <span className="admin-chip">Belum ada data</span>}
                </div>
            </section>

            <section className="admin-simple-card">
                <h2>Timeline Audit Log</h2>
                {loading ? <p>Memuat audit log...</p> : null}

                <div className="admin-table-wrap">
                    <table className="admin-table admin-table--mobile-friendly">
                        <thead>
                            <tr>
                                <th>Waktu</th>
                                <th>Actor</th>
                                <th>Aktivitas</th>
                                <th>IP</th>
                                <th>Detail</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((item) => (
                                <tr key={item.id}>
                                    <td data-label="Waktu">{new Date(item.logged_at).toLocaleString('id-ID')}</td>
                                    <td data-label="Actor">{item.actor}</td>
                                    <td data-label="Aktivitas">{item.action}</td>
                                    <td data-label="IP">{item.ip_address || '-'}</td>
                                    <td data-label="Detail">
                                        <pre className="votes-monitor-detail-json">{JSON.stringify(item.detail || {}, null, 2)}</pre>
                                    </td>
                                </tr>
                            ))}
                            {!loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>Tidak ada data audit untuk filter saat ini.</td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>

                <div className="votes-monitor-pagination">
                    <button
                        type="button"
                        className="secondary"
                        disabled={pagination.current_page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Sebelumnya
                    </button>
                    <span>Halaman {pagination.current_page} / {pagination.last_page}</span>
                    <button
                        type="button"
                        className="secondary"
                        disabled={pagination.current_page >= pagination.last_page}
                        onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                    >
                        Berikutnya
                    </button>
                </div>
            </section>
        </div>
    )
}
