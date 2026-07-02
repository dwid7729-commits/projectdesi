import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Navbar from './components/common/Navbar'
import BottomNav from './components/common/BottomNav'

// Admin Components
import Dashboard from './components/admin/Dashboard'
import Reports from './components/admin/Reports'
import QRGenerator from './components/admin/QRGenerator'
import LocationSettings from './components/admin/LocationSettings'
import Users from './components/admin/Users'
import AbsensiManagement from './components/admin/AbsensiManagement'
import Attendance from './components/admin/Attendance'
// User Components (Mobile)
import Home from './components/user/Home'
import ScanValidator from './components/user/ScanValidator'
import HistoryMobile from './components/user/HistoryMobile'
import ProfileMobile from './components/user/ProfileMobile'
import SettingsMobile from './components/user/SettingsMobile'

// Auth
import Login from './components/auth/Login'
import ResetPassword from './components/auth/ResetPassword'

function AdminLayout({ children }) {
  return (
    <div className="console">
      <Navbar />
      <main className="console-main">{children}</main>
    </div>
  )
}

function MobileLayout({ children }) {
  return (
    <div className="stage">
      <div className="phone">
        <div className="screen">
          <div className="screen-pad">{children}</div>
        </div>
        <BottomNav />
      </div>
    </div>
  )
}

function App() {
  const { isAdmin } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <MobileLayout>
            <Home />
          </MobileLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/scan" element={
        <ProtectedRoute>
          <ScanValidator />
        </ProtectedRoute>
      } />
      
      <Route path="/history" element={
        <ProtectedRoute>
          <MobileLayout>
            <HistoryMobile />
          </MobileLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <MobileLayout>
            <ProfileMobile />
          </MobileLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <MobileLayout>
            <SettingsMobile />
          </MobileLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute adminOnly>
          <AdminLayout>
            <Dashboard />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      
      
      <Route path="/admin/reports" element={
        <ProtectedRoute adminOnly>
          <AdminLayout>
            <Reports />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/qr" element={
        <ProtectedRoute adminOnly>
          <AdminLayout>
            <QRGenerator />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/locations" element={
        <ProtectedRoute adminOnly>
          <AdminLayout>
            <LocationSettings />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/users" element={
        <ProtectedRoute adminOnly>
          <AdminLayout>
            <Users />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/absensi" element={
        <ProtectedRoute adminOnly>
          <AdminLayout>
            <AbsensiManagement />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/attendance" element={
  <ProtectedRoute adminOnly>
    <AdminLayout>
      <Attendance />
    </AdminLayout>
  </ProtectedRoute>
} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App