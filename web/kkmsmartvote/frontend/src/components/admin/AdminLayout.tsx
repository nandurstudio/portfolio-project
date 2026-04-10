import { FormEvent, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { authApi } from '../../services/api'
import { adminMenuItems, hasRoleAccess, type AdminRole } from '../../config/adminMenu'
import { clearAdminSession, getStoredAdminUser, setStoredAdminUser } from './authStorage'
import '../../styles/admin/admin-shell.css'

export default function AdminLayout() {
    const location = useLocation()
    const [menuOpen, setMenuOpen] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loggingIn, setLoggingIn] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
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
        setError('')
        setSuccess('')

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
            setSuccess('Login berhasil. Menu akan tampil sesuai role Anda.')
            setReloadKey((v) => v + 1)
            setPassword('')
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Login admin gagal')
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
        setSuccess('Session admin sudah dihapus.')
        setError('')
    }

    const isOnAdminRoot = location.pathname === '/admin'

    if (!user) {
        return (
            <div className="admin-auth-shell">
                <section className="admin-auth-card">
                    <h1>Admin Panel KKM Smart Vote</h1>
                    <p>Masuk untuk membuka menu dinamis sesuai role Anda.</p>

                    {error ? <p className="admin-error">{error}</p> : null}
                    {success ? <p className="admin-success">{success}</p> : null}

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
                    <div>
                        <h1>{isOnAdminRoot ? 'Dashboard' : 'Admin Workspace'}</h1>
                        <p>Panel adaptif dengan role based navigation.</p>
                    </div>
                </header>

                <section className="admin-main-panel">
                    <Outlet />
                </section>
            </main>
        </div>
    )
}
