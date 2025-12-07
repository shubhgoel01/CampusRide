import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import History from './pages/History'
import HowItWorks from './pages/HowItWorks'
import Support from './pages/Support'
import Navbar from './components/Navbar'
import Admin from './pages/Admin'
import Guard from './pages/Guard'
import ProtectedRoute from './components/ProtectedRoute'
import Unauthorized from './pages/Unauthorized'
import DashboardLayout from './components/DashboardLayout'

function RootRedirect() {
  try {
    const token = sessionStorage.getItem('accessToken')
    const raw = sessionStorage.getItem('user')
    if (token && raw) {
      try {
        const user = JSON.parse(raw)
        if (user?.userType === 'admin') return <Navigate to="/admin" replace />
        if (user?.userType === 'guard') return <Navigate to="/guard" replace />
        return <Navigate to="/home" replace />
      } catch (e) { return <Navigate to="/home" replace /> }
    }
  } catch (e) { }
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="bg-slate-50 min-h-screen font-sans text-slate-900">
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          {/* Public Routes - No Sidebar */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Dashboard Routes */}
          <Route path="/home" element={<ProtectedRoute><DashboardLayout><Home /></DashboardLayout></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><DashboardLayout><History /></DashboardLayout></ProtectedRoute>} />
          <Route path="/how-it-works" element={<DashboardLayout><HowItWorks /></DashboardLayout>} />
          <Route path="/support" element={<DashboardLayout><Support /></DashboardLayout>} />

          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><Admin /></DashboardLayout></ProtectedRoute>} />
          <Route path="/guard" element={<ProtectedRoute allowedRoles={['guard']}><DashboardLayout><Guard /></DashboardLayout></ProtectedRoute>} />

          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
