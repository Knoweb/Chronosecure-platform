import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LandingPage from './pages/Landing'
import LoginPage from './pages/Login'
import SignupPage from './pages/Signup'
import ForgotPasswordPage from './pages/ForgotPassword'
import DashboardPage from './pages/Dashboard'
import EmployeesPage from './pages/Employees'
import AttendancePage from './pages/Attendance'
import TimeOffPage from './pages/TimeOff'
import LocationsPage from './pages/Locations'
import SettingsPage from './pages/Settings'

import ReportsPage from './pages/Reports'
import CalendarPage from './pages/Calendar'

import ResetPasswordPage from './pages/ResetPassword'
import SuperAdminDashboard from './pages/SuperAdminDashboard'

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    // If user is logged in but doesn't have role
    if (requiredRole === 'SUPER_ADMIN') {
      return <Navigate to="/dashboard" replace />
    }
    // General fallback
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* SUPER ADMIN ROUTE */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute requiredRole="SUPER_ADMIN">
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* REGULAR DASHBOARD */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <EmployeesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <AttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/time-off"
        element={
          <ProtectedRoute>
            <TimeOffPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/locations"
        element={
          <ProtectedRoute>
            <LocationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<LandingPage />} />
    </Routes>
  )
}

export default App
