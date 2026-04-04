import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './hooks/useAuth'
import VoterPage from './pages/VoterPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Candidates from './pages/admin/Candidates'
import Members from './pages/admin/Members'
import Votes from './pages/admin/Votes'
import Results from './pages/admin/Results'
import AuditLogs from './pages/admin/AuditLogs'
import Users from './pages/admin/Users'
import Settings from './pages/admin/Settings'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (user?.role !== 'admin') return <Navigate to="/admin" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Public voter route */}
      <Route path="/" element={<VoterPage />} />

      {/* Admin login */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Protected admin routes */}
      <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="candidates" element={<Candidates />} />
        <Route path="members" element={<Members />} />
        <Route path="votes" element={<Votes />} />
        <Route path="results" element={<Results />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="users" element={<RequireAdmin><Users /></RequireAdmin>} />
        <Route path="settings" element={<RequireAdmin><Settings /></RequireAdmin>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
