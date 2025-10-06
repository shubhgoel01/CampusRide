import React, {useState} from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'

export default function Login(){
  const [form, setForm] = useState({ email: '', userName: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e)=> setForm(prev=> ({...prev, [e.target.name]: e.target.value}))

  const handleSubmit = async (e) =>{
    e.preventDefault()
    setError('')
    if(!form.password || (!form.email && !form.userName)){
      setError('Provide email or username and password')
      return
    }
    try{
      const payload = { password: form.password }
      if(form.email) payload.email = form.email
      else payload.userName = form.userName

      const res = await login(payload)
      if(res?.data?.statusCode === 200 || res?.data?.success){
        const user = res.data.data?.user || res.data.data
        if(user) sessionStorage.setItem('user', JSON.stringify(user))
        const token = res.data.data?.accessToken || res.data.data?.accessToken
        if(token) {
          sessionStorage.setItem('accessToken', token)
          try{ 
            window.dispatchEvent(new Event('userChanged'))
          }catch(e){}
        }
        navigate('/home')
      }
    }
    catch(err){
      setError(err?.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm text-gray-600">Email</span>
          <input name="email" value={form.email} onChange={handleChange} className="w-full border px-2 py-1 rounded mt-1" />
        </label>
        <div className="text-center my-2">OR</div>
        <label className="block">
          <span className="text-sm text-gray-600">Username</span>
          <input name="userName" value={form.userName} onChange={handleChange} className="w-full border px-2 py-1 rounded mt-1" />
        </label>
        <label className="block mt-3">
          <span className="text-sm text-gray-600">Password</span>
          <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full border px-2 py-1 rounded mt-1" />
        </label>
        <div className="mt-4 flex justify-end">
          <button className="bg-indigo-600 text-white px-4 py-1 rounded">Login</button>
        </div>
      </form>
    </div>
  )
}
