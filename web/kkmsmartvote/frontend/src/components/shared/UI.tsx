import React from 'react'

// ── Alert ──────────────────────────────────────────────────────────────────
type AlertType = 'success' | 'error' | 'info' | 'warning'
export function Alert({ type, message }: { type: AlertType; message: string }) {
  if (!message) return null
  return <div className={`alert alert-${type}`}>{message}</div>
}

// ── Modal ──────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box fade-in">
        <p className="modal-title">{title}</p>
        {children}
      </div>
    </div>
  )
}

// ── Avatar ─────────────────────────────────────────────────────────────────
const COLORS = [
  ['#E6F1FB', '#0C447C'],
  ['#EAF3DE', '#3B6D11'],
  ['#FAEEDA', '#854F0B'],
  ['#EEEDFE', '#534AB7'],
  ['#E1F5EE', '#0F6E56'],
]
export function Avatar({ name, size = 38, index = 0 }: { name: string; size?: number; index?: number }) {
  const [bg, fg] = COLORS[index % COLORS.length]
  const initials = name.split(' ').slice(0, 2).map((w) => w[0] || '').join('').toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 600, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

// ── Spinner ────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{
        width: 32, height: 32, border: '3px solid var(--border)',
        borderTopColor: 'var(--blue)', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── Stat Card ──────────────────────────────────────────────────────────────
export function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-num" style={color ? { color } : {}}>{value}</p>
    </div>
  )
}

// ── Progress Bar ───────────────────────────────────────────────────────────
export function ProgressBar({ pct, color }: { pct: number; color?: string }) {
  return (
    <div className="progress-wrap">
      <div className="progress-bar" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────────────────
export function EmptyState({ message }: { message: string }) {
  return (
    <p style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>{message}</p>
  )
}

// ── Page Header ────────────────────────────────────────────────────────────
export function PageHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>{title}</h1>
      {action}
    </div>
  )
}

// ── Countdown ─────────────────────────────────────────────────────────────
export function Countdown({ endDate, endTime }: { endDate: string; endTime: string }) {
  const [diff, setDiff] = React.useState(0)

  React.useEffect(() => {
    const end = new Date(`${endDate}T${endTime}+07:00`).getTime()
    const tick = () => setDiff(Math.max(0, end - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endDate, endTime])

  if (diff <= 0) return <p style={{ color: 'var(--red)', fontSize: 12, fontWeight: 600, textAlign: 'center' }}>Periode voting telah berakhir</p>

  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)

  const Block = ({ n, lbl }: { n: number; lbl: string }) => (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '8px 14px', textAlign: 'center', minWidth: 56 }}>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--blue)' }}>{String(n).padStart(2, '0')}</div>
      <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      <Block n={d} lbl="Hari" /><Block n={h} lbl="Jam" /><Block n={m} lbl="Menit" /><Block n={s} lbl="Detik" />
    </div>
  )
}
