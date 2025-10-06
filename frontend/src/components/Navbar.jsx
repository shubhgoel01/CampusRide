import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../api'

export default function Navbar(){
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(()=>{
    const cached = sessionStorage.getItem('user')
    if(cached){
      try{ setUser(JSON.parse(cached)) }catch(e){}
    }
    const onUserChanged = ()=>{
      const c = sessionStorage.getItem('user')
      if(c){ try{ setUser(JSON.parse(c)) }catch(e){ setUser(null) } }
      else setUser(null)
    }
    window.addEventListener('userChanged', onUserChanged)
    return ()=> window.removeEventListener('userChanged', onUserChanged)
  },[])

  const handleLogout = async ()=>{
    if(!user) return
    try{ await logout(user._id) }catch(e){}
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('accessToken')
    setUser(null)
    try{ window.dispatchEvent(new Event('userChanged')) }catch(e){}
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow">
      <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/home" className="text-indigo-600 font-bold">CampusRide</Link>
        <div className="space-x-4">
          {!user && (
            <>
              <Link to="/login" className="text-gray-600">Login</Link>
              <Link to="/register" className="text-gray-600">Register</Link>
            </>
          )}
          {user && (
            <>
              {user.userType === 'admin' && <Link to="/admin" className="text-gray-600">Admin</Link>}
              {user.userType === 'guard' && <Link to="/guard" className="text-gray-600">Guard</Link>}
              <button onClick={handleLogout} className="text-gray-600">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
