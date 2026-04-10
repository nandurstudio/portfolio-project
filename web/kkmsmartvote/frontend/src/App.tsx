import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import VotingVerificationPage from './pages/VotingVerificationPage'
import MemberLookupPage from './pages/MemberLookupPage'
import VotePage from './pages/VotePage'
import VoteSuccessPage from './pages/VoteSuccessPage'
import AdminLandingSetupPage from './pages/AdminLandingSetupPage'
import AdminLayout from './components/admin/AdminLayout'
import RoleGuard from './components/admin/RoleGuard'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import MasterUsersPage from './pages/admin/MasterUsersPage'
import MasterDepartmentsPage from './pages/admin/MasterDepartmentsPage'
import MasterCandidatesPage from './pages/admin/MasterCandidatesPage'
import VotesMonitorPage from './pages/admin/VotesMonitorPage'

export default function App() {
  return (
    <Routes>
      {/* Public landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Public voter routes - 2-layer OTP voting */}
      <Route path="/otp" element={<VotingVerificationPage />} />
      <Route path="/member-lookup" element={<MemberLookupPage />} />
      <Route path="/vote" element={<VotePage />} />
      <Route path="/vote-success" element={<VoteSuccessPage />} />

      {/* Admin routes with role-based menu */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route
          path="setup-landing"
          element={
            <RoleGuard allowedRoles={['super_admin', 'admin']}>
              <AdminLandingSetupPage />
            </RoleGuard>
          }
        />
        <Route
          path="master-users"
          element={
            <RoleGuard allowedRoles={['super_admin', 'admin']}>
              <MasterUsersPage />
            </RoleGuard>
          }
        />
        <Route
          path="master-departments"
          element={
            <RoleGuard allowedRoles={['super_admin', 'admin']}>
              <MasterDepartmentsPage />
            </RoleGuard>
          }
        />
        <Route
          path="master-candidates"
          element={
            <RoleGuard allowedRoles={['super_admin', 'admin']}>
              <MasterCandidatesPage />
            </RoleGuard>
          }
        />
        <Route
          path="votes"
          element={
            <RoleGuard allowedRoles={['super_admin', 'admin', 'panitia']}>
              <VotesMonitorPage />
            </RoleGuard>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
