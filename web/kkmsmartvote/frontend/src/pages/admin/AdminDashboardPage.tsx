import { adminMenuItems, hasRoleAccess } from '../../config/adminMenu'
import { getStoredAdminUser } from '../../components/admin/authStorage'

export default function AdminDashboardPage() {
    const user = getStoredAdminUser()

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
