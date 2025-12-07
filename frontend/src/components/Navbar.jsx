import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../api'
import DarkModeToggle from './DarkModeToggle'
import { HomeIcon, BookIcon, AdminIcon, GuardIcon } from './Icons'

export default function Navbar(){
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(()=>{
    const cached = sessionStorage.getItem('user')
    if(cached){ try{ setUser(JSON.parse(cached)) }catch(e){} }
    const onUserChanged = ()=>{
      const c = sessionStorage.getItem('user')
      if(c){ try{ setUser(JSON.parse(c)) }catch(e){ setUser(null) } }
      else setUser(null)
    }
    window.addEventListener('userChanged', onUserChanged)
    return ()=> window.removeEventListener('userChanged', onUserChanged)
  },[])

  const handleLogout = async ()=>{
    if(user){ try{ await logout(user._id) }catch(e){} }
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('accessToken')
    setUser(null)
    try{ window.dispatchEvent(new Event('userChanged')) }catch(e){}
    navigate('/login')
  }

  return (
    <header className="sticky top-3 z-40 mx-4 md:mx-8 bg-gradient-to-r from-sky-700 to-indigo-700 text-white shadow-lg rounded-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center font-bold">CR</div>
          <div className="font-semibold text-lg">CampusRide</div>
        </Link>

        <nav className="hidden sm:flex items-center gap-4">
          <Link to="/home" className="flex items-center gap-2 text-sky-100 hover:text-white px-3 py-1 rounded hover:bg-white/5">
            <HomeIcon className="h-4 w-4 text-sky-100" />
            <span>Home</span>
          </Link>
          <Link to="/history" className="flex items-center gap-2 text-sky-100 hover:text-white px-3 py-1 rounded hover:bg-white/5">History</Link>
          <Link to="/how-it-works" className="flex items-center gap-2 text-sky-100 hover:text-white px-3 py-1 rounded hover:bg-white/5">How it works</Link>
          <Link to="/support" className="flex items-center gap-2 text-sky-100 hover:text-white px-3 py-1 rounded hover:bg-white/5">Support</Link>
          {/* Book option intentionally removed from top app bar for student module */}
          {user?.userType === 'admin' && <Link to="/admin" className="flex items-center gap-2 text-sky-100 hover:text-white px-3 py-1 rounded hover:bg-white/5"><AdminIcon className="h-4 w-4" />Admin</Link>}
          {user?.userType === 'guard' && <Link to="/guard" className="flex items-center gap-2 text-sky-100 hover:text-white px-3 py-1 rounded hover:bg-white/5"><GuardIcon className="h-4 w-4" />Guard</Link>}
        </nav>

        <div className="flex items-center gap-4">
          <DarkModeToggle />
          {!user && (
            <>
              <Link to="/login" className="bg-white/10 px-3 py-1 rounded hover:bg-white/20">Login</Link>
              <Link to="/register" className="bg-white/10 px-3 py-1 rounded hover:bg-white/20">Register</Link>
            </>
          )}

          {user && (
            <div className="flex items-center gap-3">
              <div className="text-sm text-white/90">{user.fullName || user.userName}</div>
              <div className="bg-white/10 px-2 py-1 rounded text-sm capitalize">{user.userType}</div>
              <button onClick={handleLogout} className="bg-white/10 px-3 py-1 rounded hover:bg-white/20 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7"/></svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
