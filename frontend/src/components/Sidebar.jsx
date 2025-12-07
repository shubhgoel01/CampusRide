import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../api'

// Icons (SVG inline for simplicity/portability)
const HomeIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
const HistoryIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const InfoIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const SupportIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 9.636a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" /></svg>
const AdminIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
const LogoutIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>

export default function Sidebar() {
    const [user, setUser] = useState(null)
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        const cached = sessionStorage.getItem('user')
        if (cached) { try { setUser(JSON.parse(cached)) } catch (e) { } }
        const onUserChanged = () => {
            const c = sessionStorage.getItem('user')
            if (c) { try { setUser(JSON.parse(c)) } catch (e) { setUser(null) } }
            else setUser(null)
        }
        window.addEventListener('userChanged', onUserChanged)
        return () => window.removeEventListener('userChanged', onUserChanged)
    }, [])

    const handleLogout = async () => {
        if (user) { try { await logout(user._id) } catch (e) { } }
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('accessToken')
        setUser(null)
        try { window.dispatchEvent(new Event('userChanged')) } catch (e) { }
        navigate('/login')
    }

    const NavItem = ({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to
        return (
            <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="font-medium">{label}</span>
            </Link>
        )
    }

    return (
        <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col fixed left-0 top-0 z-50">
            {/* Brand */}
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl shadow-sm">CR</div>
                    <div className="font-bold text-xl text-slate-800">CampusRide</div>
                </div>
            </div>

            {/* Nav Link Container */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <NavItem to="/home" icon={HomeIcon} label="Dashboard" />
                <NavItem to="/history" icon={HistoryIcon} label="My Rides" />
                <NavItem to="/how-it-works" icon={InfoIcon} label="How it works" />
                <NavItem to="/support" icon={SupportIcon} label="Support" />

                {/* Role Based Links */}
                {user?.userType === 'admin' && (
                    <div className="pt-4 mt-4 border-t border-slate-100">
                        <div className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Admin</div>
                        <NavItem to="/admin" icon={AdminIcon} label="Admin Dashboard" />
                    </div>
                )}

                {user?.userType === 'guard' && (
                    <div className="pt-4 mt-4 border-t border-slate-100">
                        <div className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Staff</div>
                        <NavItem to="/guard" icon={AdminIcon} label="Guard Panel" />
                    </div>
                )}
            </nav>

            {/* User Profile Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
                {user ? (
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold border-2 border-white shadow-sm">
                            {user.fullName ? user.fullName[0] : 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">{user.fullName || user.userName}</div>
                            <div className="text-xs text-slate-500 capitalize">{user.userType}</div>
                        </div>
                        <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <LogoutIcon className="h-5 w-5" />
                        </button>
                    </div>
                ) : (
                    <Link to="/login" className="flex items-center justify-center w-full py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition">
                        Login
                    </Link>
                )}
            </div>
        </aside>
    )
}
