import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'
import { StatCard, ProgressBar, Spinner, Avatar } from '../../components/shared/UI'
import type { DashboardData } from '../../types'
import { useAuthStore } from '../../hooks/useAuth'

const BAR_COLORS = ['var(--blue)', '#639922', '#854F0B', '#534AB7']

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    adminApi.dashboard().then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const d = data!
  const total = d.total_valid

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Suara Sah" value={d.total_valid} color="var(--blue)" />
        <StatCard label="Total Anggota" value={d.total_members} />
        <StatCard label="Partisipasi" value={`${d.participation_pct}%`} color="var(--green)" />
        <StatCard label="Tidak Sah" value={d.total_invalid} color="var(--red)" />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ fontSize: 15, fontWeight: 700 }}>Perolehan Suara Real-time</p>
          {!d.election.is_finalized && user?.role === 'admin' && (
            <a href="/admin/results" className="btn btn-sm btn-success">Finalisasi Hasil →</a>
          )}
          {d.election.is_finalized && <span className="badge badge-green">✓ Difinalisasi</span>}
        </div>
        {d.candidate_stats.map((c, i) => {
          const pct = total > 0 ? Math.round(c.valid_votes / total * 100) : 0
          return (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <Avatar name={c.name} size={38} index={i} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>{c.valid_votes} suara · {pct}%</span>
                </div>
                <ProgressBar pct={pct} color={BAR_COLORS[i % BAR_COLORS.length]} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>Info Pemilihan</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
          {[
            ['Nama', d.election.election_name],
            ['Periode', d.election.period],
            ['Mulai', d.election.start_date],
            ['Selesai', `${d.election.end_date} ${d.election.end_time} WIB`],
          ].map(([lbl, val]) => (
            <div key={lbl}>
              <span style={{ color: 'var(--text3)' }}>{lbl}</span>
              <p style={{ fontWeight: 500, marginTop: 2 }}>{val}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
