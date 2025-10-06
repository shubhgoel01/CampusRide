import React, {useState} from 'react'
import { useNavigate } from 'react-router-dom'
import { register } from '../api'

export default function Register(){
  const [form, setForm] = useState({ userName: '', email: '', password: '', fullName: '', userType: 'student' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e)=> setForm(prev=> ({...prev, [e.target.name]: e.target.value}))

  const handleSubmit = async (e) =>{
    e.preventDefault()
    setError('')
    const { userName, email, password, fullName } = form
    if(!userName || !email || !password || !fullName){
      setError('All fields are required')
      return
    }

    try{
      const res = await register(form)
      if(res?.data?.statusCode === 200 || res?.data?.success){
        const user = res.data.data?.user || res.data.data
        if(user) sessionStorage.setItem('user', JSON.stringify(user))
        const token = res.data.data?.accessToken || res.data.data?.accessToken
        if(token) {
          sessionStorage.setItem('accessToken', token)
          try{ window.dispatchEvent(new Event('userChanged')) }catch(e){}
        }
        navigate('/home')
      }
    }
    catch(err){
      setError(err?.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Register</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm text-gray-600">Full name</span>
          <input name="fullName" value={form.fullName} onChange={handleChange} className="w-full border px-2 py-1 rounded mt-1" />
        </label>
        <label className="block mt-2">
          <span className="text-sm text-gray-600">Username</span>
          <input name="userName" value={form.userName} onChange={handleChange} className="w-full border px-2 py-1 rounded mt-1" />
        </label>
        <label className="block mt-2">
          <span className="text-sm text-gray-600">Email</span>
          <input name="email" value={form.email} onChange={handleChange} className="w-full border px-2 py-1 rounded mt-1" />
        </label>
        <label className="block mt-2">
          <span className="text-sm text-gray-600">Password</span>
          <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full border px-2 py-1 rounded mt-1" />
        </label>
        <div className="mt-3">
          <label className="text-sm text-gray-600">User type</label>
          <select name="userType" value={form.userType} onChange={handleChange} className="w-full border px-2 py-1 rounded mt-1">
            <option value="student">Student</option>
            <option value="guard">Guard</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="mt-4 flex justify-end">
          <button className="bg-indigo-600 text-white px-4 py-1 rounded">Register</button>
        </div>
      </form>
    </div>
  )
}
