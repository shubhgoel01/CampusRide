import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import NewBooking from './pages/NewBooking'
import Navbar from './components/Navbar'
import Admin from './pages/Admin'
import Guard from './pages/Guard'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="max-w-4xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          <Route path="/booking/new" element={<NewBooking />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/guard" element={<Guard />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
