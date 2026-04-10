import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { AdminRole } from '../../config/adminMenu'
import { getStoredAdminUser } from './authStorage'

type RoleGuardProps = {
    allowedRoles: AdminRole[]
    children: ReactNode
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
    const user = getStoredAdminUser()

    if (!user) {
        return <Navigate to="/admin" replace />
    }

    if (!allowedRoles.includes(user.role)) {
        return (
            <section className="admin-simple-card">
                <h2>Akses Ditolak</h2>
                <p>Role Anda tidak memiliki izin untuk membuka menu ini.</p>
            </section>
        )
    }

    return <>{children}</>
}
