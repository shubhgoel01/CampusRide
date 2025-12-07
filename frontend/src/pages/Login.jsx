import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'

// Import asset (Assumed path based on previous step)
import loginBg from '../assets/images/login-bg.png'

export default function Login() {
  const [form, setForm] = useState({ email: '', userName: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.password || (!form.email && !form.userName)) {
      setError('Please provide email/username and password.')
      return
    }
    setLoading(true)
    try {
      const payload = { password: form.password }
      if (form.email) payload.email = form.email
      else payload.userName = form.userName

      const res = await login(payload)
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
        setError('Invalid credentials. Please try again.')
      }
    }
    catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Please check your network.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full">
      {/* Visual Side (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-cover bg-center overflow-hidden" style={{ backgroundImage: `url(${loginBg})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-12 text-white">
          <h1 className="text-4xl font-bold mb-4">CampusRide</h1>
          <p className="text-lg text-white/80 max-w-md">Experience the smartest way to travel across campus. Fast, Eco-friendly, and Convenient.</p>
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="inline-flex lg:hidden items-center justify-center w-12 h-12 rounded-xl bg-primary text-white font-bold mb-6">CR</div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="mt-2 text-slate-500">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Email Address</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-lg text-sm shadow-sm placeholder-slate-400
                        focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200" placeholder="student@university.edu" />
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-3 text-slate-400 text-xs uppercase">Or Username</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Username</label>
                <input name="userName" type="text" value={form.userName} onChange={handleChange} className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-lg text-sm shadow-sm placeholder-slate-400
                        focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Enter username" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} className="mt-1 block w-full px-3 py-3 bg-white border border-slate-300 rounded-lg text-sm shadow-sm placeholder-slate-400
                        focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="••••••••" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-500">Remember me</label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary hover:text-primary-dark">Forgot password?</a>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <p className="mt-2 text-center text-sm text-slate-500">
              Don't have an account? <button type="button" onClick={() => navigate('/register')} className="font-semibold text-primary hover:text-primary-dark">Create free account</button>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
