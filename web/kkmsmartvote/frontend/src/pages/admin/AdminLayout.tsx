import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../hooks/useAuth'
import { authApi } from '../../services/api'
import { Avatar } from '../../components/shared/UI'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { to: '/admin/candidates', label: 'Kandidat', icon: '👤' },
  { to: '/admin/members', label: 'Anggota', icon: '👥' },
  { to: '/admin/votes', label: 'Rekap Suara', icon: '🗳️' },
  { to: '/admin/results', label: 'Hasil', icon: '🏆' },
  { to: '/admin/audit', label: 'Audit Trail', icon: '📋' },
]

const ADMIN_NAV = [
  { to: '/admin/users', label: 'Pengguna', icon: '🔑' },
  { to: '/admin/settings', label: 'Pengaturan', icon: '⚙️' },
]

export default function AdminLayout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  async function handleLogout() {
    try { await authApi.logout() } catch { }
    clearAuth()
    navigate('/admin/login')
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <div className="sidebar">
        <div style={{ padding: '20px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'var(--blue)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E6F1FB', fontWeight: 800, fontSize: 16 }}>K</div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700 }}>Karya Mandiri</p>
            <p style={{ fontSize: 10, color: 'var(--text3)' }}>Panel Admin</p>
          </div>
        </div>

        <div style={{ padding: '12px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 8px 4px' }}>Menu</p>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.exact}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '14px 8px 4px' }}>Admin</p>
              {ADMIN_NAV.map(n => (
                <NavLink key={n.to} to={n.to}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                  <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{n.icon}</span>
                  {n.label}
                </NavLink>
              ))}
            </>
          )}
        </div>

        <div style={{ padding: '14px 10px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--surface2)', borderRadius: 'var(--r)', marginBottom: 8 }}>
            <Avatar name={user?.name ?? ''} size={30} index={0} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
              <p style={{ fontSize: 10, color: 'var(--text3)' }}>{user?.role}</p>
            </div>
          </div>
          <button className="btn btn-sm btn-block" onClick={handleLogout}>Keluar</button>
        </div>
      </div>

      {/* Main */}
      <div className="main-area">
        <div className="topbar">
          <p style={{ fontSize: 14, fontWeight: 600 }}>Koperasi Karya Mandiri — Sistem Pemilihan</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge badge-green">● Aktif</span>
            <a href="/" className="btn btn-sm">Lihat Halaman Voting</a>
          </div>
        </div>
        <div className="page-content fade-in">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
