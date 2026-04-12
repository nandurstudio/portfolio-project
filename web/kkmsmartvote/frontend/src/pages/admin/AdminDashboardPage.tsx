import { useEffect, useMemo, useState } from 'react'
import { adminMenuItems, hasRoleAccess } from '../../config/adminMenu'
import { getStoredAdminUser } from '../../components/admin/authStorage'
import api from '../../services/api'
import { notify } from '../../utils/notify'
import type { DashboardData } from '../../types'

export default function AdminDashboardPage() {
    const user = getStoredAdminUser()
    const [loading, setLoading] = useState(true)
    const [dashboard, setDashboard] = useState<DashboardData | null>(null)

    useEffect(() => {
        let mounted = true

        const loadDashboard = async () => {
            try {
                setLoading(true)
                const res = await api.get('/admin/dashboard')
                if (!mounted) return
                setDashboard(res?.data ?? null)
            } catch (err: any) {
                if (!mounted) return
                notify.error('Gagal Memuat Dashboard', err?.response?.data?.message || err?.message || 'Tidak bisa memuat ringkasan dashboard')
            } finally {
                if (mounted) setLoading(false)
            }
        }

        loadDashboard()
        return () => {
            mounted = false
        }
    }, [])

    const maxVotes = useMemo(() => {
        const values = (dashboard?.site_vote_chart || []).map((row) => Number(row.total_votes || 0))
        return values.length ? Math.max(...values, 1) : 1
    }, [dashboard])

    return (
        <div className="admin-page-grid">
            <section className="admin-simple-card">
                <h2>Selamat Datang</h2>
                <p>
                    Halo {user?.name || 'Admin'}, Anda login sebagai <strong>{user?.role || '-'}</strong>.
                </p>
                <p>
                    Pilih menu di sisi kiri. Item menu otomatis ditampilkan sesuai role Anda.
                </p>
            </section>

            <section className="admin-simple-card">
                <h2>Ringkasan Site Voting</h2>
                {loading ? (
                    <p>Memuat data dashboard...</p>
                ) : (
                    <>
                        <div className="admin-chip-list">
                            <span className="admin-chip">Total Site: {dashboard?.site_vote_overview?.total_sites ?? 0}</span>
                            <span className="admin-chip">Site Sudah Vote: {dashboard?.site_vote_overview?.sites_with_votes ?? 0}</span>
                            <span className="admin-chip">Site Belum Vote: {dashboard?.site_vote_overview?.sites_without_votes ?? 0}</span>
                        </div>

                        <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                            {(dashboard?.site_vote_chart || []).map((row) => {
                                const totalVotes = Number(row.total_votes || 0)
                                const widthPct = Math.max(4, Math.round((totalVotes / maxVotes) * 100))

                                return (
                                    <div key={row.site_id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                                            <strong>{row.site_name} ({row.site_code})</strong>
                                            <span>{totalVotes} vote</span>
                                        </div>
                                        <div style={{ height: 10, borderRadius: 999, background: '#e8edf3', overflow: 'hidden' }}>
                                            <div
                                                style={{
                                                    width: `${widthPct}%`,
                                                    height: '100%',
                                                    background: row.has_votes ? '#0f766e' : '#94a3b8',
                                                    transition: 'width 0.3s ease',
                                                }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </section>

            <section className="admin-simple-card">
                <h2>Quick Access</h2>
                <div className="admin-chip-list">
                    {adminMenuItems
                        .filter((item) => hasRoleAccess((user?.role as any) ?? null, item.roles))
                        .map((item) => (
                            <span key={item.key} className="admin-chip">{item.label}</span>
                        ))}
                </div>
            </section>
        </div>
    )
}
