import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register } from '../api'
import loginBg from '../assets/images/login-bg.png'

export default function Register() {
  const [form, setForm] = useState({ userName: '', email: '', password: '', fullName: '', userType: 'student' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const { userName, email, password, fullName } = form
    if (!userName || !email || !password || !fullName) {
      setError('All fields are required')
      return
    }
    setLoading(true)

    try {
      const res = await register(form)
      if (res?.data?.statusCode === 200 || res?.data?.success) {
        const user = res.data.data?.user || res.data.data
        if (user) sessionStorage.setItem('user', JSON.stringify(user))
        const token = res.data.data?.accessToken || res.data.data?.accessToken
        if (token) {
          sessionStorage.setItem('accessToken', token)
          try { window.dispatchEvent(new Event('userChanged')) } catch (e) { }
        }
        navigate('/home')
      } else {
        setError('Registration failed. Please try again.')
      }
    }
    catch (err) {
      setError(err?.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full">
      {/* Visual Side */}
      <div className="hidden lg:flex w-1/2 relative bg-cover bg-center overflow-hidden" style={{ backgroundImage: `url(${loginBg})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-12 text-white">
          <h1 className="text-4xl font-bold mb-4">Join CampusRide</h1>
          <p className="text-lg text-white/80 max-w-md">Create your account and start your journey today.</p>
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Account</h2>
            <p className="mt-2 text-slate-500">Enter your details to register.</p>
          </div>

          {error && <div className="p-3 rounded bg-red-50 text-red-600 text-sm border border-red-100">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <input name="fullName" value={form.fullName} onChange={handleChange} className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Username</label>
              <input name="userName" value={form.userName} onChange={handleChange} className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="johndoe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">I am a...</label>
              <select name="userType" value={form.userType} onChange={handleChange} className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option value="student">Student</option>
                <option value="guard">Guard</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>

            <p className="mt-2 text-center text-sm text-slate-500">
              Already have an account? <button type="button" onClick={() => navigate('/login')} className="font-semibold text-primary hover:text-primary-dark">Log in</button>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
