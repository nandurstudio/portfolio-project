import { FormEvent, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { authApi } from '../../services/api'
import { adminMenuItems, hasRoleAccess, type AdminRole } from '../../config/adminMenu'
import { clearAdminSession, getStoredAdminUser, setStoredAdminUser } from './authStorage'
import { notify } from '../../utils/notify'
import '../../styles/admin/admin-shell.css'

export default function AdminLayout() {
    const location = useLocation()
    const [menuOpen, setMenuOpen] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loggingIn, setLoggingIn] = useState(false)
    const [reloadKey, setReloadKey] = useState(0)

    const user = useMemo(() => getStoredAdminUser(), [reloadKey])
    const role = (user?.role ?? null) as AdminRole | null

    const visibleMenus = useMemo(
        () => adminMenuItems.filter((item) => hasRoleAccess(role, item.roles)),
        [role],
    )

    const loginAdmin = async (e: FormEvent) => {
        e.preventDefault()
        setLoggingIn(true)

        try {
            const res = await authApi.adminLogin(username, password)
            const token = res?.data?.token
            const nextUser = res?.data?.user

            if (!token || !nextUser) {
                throw new Error('Response login tidak lengkap')
            }

            localStorage.setItem('admin_token', token)
            localStorage.setItem('token', token)
            setStoredAdminUser(nextUser)
            notify.success('Login Berhasil', 'Menu akan tampil sesuai role Anda.')
            setReloadKey((v) => v + 1)
            setPassword('')
        } catch (err: any) {
            notify.error('Login Admin Gagal', err?.response?.data?.message || err?.message || 'Login admin gagal')
        } finally {
            setLoggingIn(false)
        }
    }

    const logoutAdmin = async () => {
        try {
            await authApi.logout()
        } catch {
            // Ignore API logout error and clear local session anyway.
        }
        clearAdminSession()
        setReloadKey((v) => v + 1)
        notify.success('Logout Berhasil', 'Session admin sudah dihapus.')
    }

    const isOnAdminRoot = location.pathname === '/admin'

    if (!user) {
        return (
            <div className="admin-auth-shell">
                <section className="admin-auth-card">
                    <h1>Admin Panel KKM Smart Vote</h1>
                    <p>Masuk untuk membuka menu dinamis sesuai role Anda.</p>

                    <form onSubmit={loginAdmin} className="admin-auth-form">
                        <label>
                            Username
                            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </label>
                        <label>
                            Password
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </label>
                        <button type="submit" disabled={loggingIn}>{loggingIn ? 'Login...' : 'Login Admin'}</button>
                    </form>

                    <div className="admin-auth-links">
                        <Link to="/">Kembali ke landing page</Link>
                    </div>
                </section>
            </div>
        )
    }

    return (
        <div className="admin-shell">
            <aside className={`admin-sidebar ${menuOpen ? 'open' : ''}`}>
                <div className="admin-brand">
                    <h2>KKM Admin</h2>
                    <p>{user.name}</p>
                    <span className="admin-role-chip">{user.role}</span>
                </div>

                <nav className="admin-nav">
                    {visibleMenus.map((item) => (
                        <NavLink
                            key={item.key}
                            to={item.path}
                            end={item.path === '/admin'}
                            onClick={() => setMenuOpen(false)}
                            className={({ isActive }) => (isActive ? 'active' : '')}
                        >
                            <strong>{item.label}</strong>
                            <small>{item.description}</small>
                        </NavLink>
                    ))}
                </nav>

                <div className="admin-sidebar-actions">
                    <button onClick={logoutAdmin} type="button">Logout</button>
                </div>
            </aside>

            <main className="admin-content">
                <header className="admin-topbar">
                    <button className="admin-menu-btn" onClick={() => setMenuOpen((v) => !v)} type="button">Menu</button>
                    <div className="admin-topbar-left">
                        <h1>{isOnAdminRoot ? 'Dashboard' : 'Admin Workspace'}</h1>
                        <p>Panel adaptif dengan role based navigation.</p>
                    </div>
                    <div className="admin-topbar-right">
                        <Link to="/" className="admin-home-link">Home</Link>
                    </div>
                </header>

                <section className="admin-main-panel">
                    <Outlet />
                </section>
            </main>
        </div>
    )
}
