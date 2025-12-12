import React, { useEffect, useState } from 'react'
import api, { getAllUsers, getBookings, getReturnedBookings, getLocations, getActiveBookings, getTransactions, getAdminBookings, getCycles, getStuckBookings } from '../api'
import Card from '../components/Card'
import Modal from '../components/Modal'
import BookingModal from '../components/BookingModal'
import AdminLocations from './AdminLocations'
import { setCachedLocations, formatLocation } from '../utils/locationCache'
import AdminCycles from './AdminCycles'

// UI Components
const StatCard = ({ title, value, icon, color = 'blue', subtext, filter, onFilterChange }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow`}>
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
        {icon}
      </div>
      {filter && (
        <select
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      )}
    </div>
    <div>
      <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mt-1">{title}</p>
      {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
    </div>
  </div>
)

const TabButton = ({ active, onClick, children, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-3 font-medium text-sm rounded-lg transition-all ${active
      ? 'bg-primary text-white shadow-md shadow-primary/30'
      : 'text-slate-500 hover:bg-slate-100'
      }`}
  >
    {icon}
    {children}
  </button>
)

const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-green-100 text-green-700 border-green-200',
    completed: 'bg-blue-100 text-blue-700 border-blue-200',
    returned: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    canceled: 'bg-red-100 text-red-700 border-red-200',
    pending: 'bg-orange-100 text-orange-700 border-orange-200',
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    user: 'bg-slate-100 text-slate-700 border-slate-200',
    guard: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  }
  const s = String(status).toLowerCase()
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[s] || styles.user} capitalize`}>
      {status}
    </span>
  )
}

export default function Admin() {
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('dashboard') // dashboard, users, bookings, stuck, transactions, manageCycles, locations

  // Data States
  const [stats, setStats] = useState({ users: 0, active: 0, totalRides: 0, issues: 0 })
  const [ridesFilter, setRidesFilter] = useState('all') // today, week, month, all

  const [usersList, setUsersList] = useState([])
  const [activeBookingsList, setActiveBookingsList] = useState([]) // Live rides
  const [stuckList, setStuckList] = useState([])
  const [allBookingsList, setAllBookingsList] = useState([]) // For stats
  const [transactionsList, setTransactionsList] = useState([])
  const [locations, setLocations] = useState([])

  // Modals
  const [modalOpen, setModalOpen] = useState(false)
  const [modalBooking, setModalBooking] = useState(null)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  // Loading Functions
  const loadStats = async () => {
    try {
      const [u, a, t, all] = await Promise.all([
        getAllUsers(),
        getActiveBookings({}),
        getTransactions(),
        getAdminBookings() // Fetches all bookings for admin
      ])

      const users = u?.data?.data?.length || 0
      const active = a?.data?.data?.length || 0
      const allBookings = all?.data?.data || []
      const issues = allBookings.filter(b => (b.status === 'active' && (Date.now() - new Date(b.startTime).getTime()) > 4 * 3600 * 1000) || b.penaltyAmount > 500).length

      setStats(prev => ({ ...prev, users, active, issues }))
      setUsersList(u?.data?.data || [])
      setActiveBookingsList(a?.data?.data || [])
      setAllBookingsList(allBookings)
      setTransactionsList(t?.data?.data || [])
    } catch (e) { console.error(e) }
  }

  // Recalculate filtered rides when filter or data changes
  useEffect(() => {
    if (!allBookingsList) return

    let count = 0
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const weekStart = now.getTime() - 7 * 24 * 60 * 60 * 1000
    const monthStart = now.getTime() - 30 * 24 * 60 * 60 * 1000

    count = allBookingsList.filter(b => {
      const t = new Date(b.startTime).getTime()
      if (ridesFilter === 'today') return t >= todayStart
      if (ridesFilter === 'week') return t >= weekStart
      if (ridesFilter === 'month') return t >= monthStart
      return true
    }).length

    setStats(prev => ({ ...prev, totalRides: count }))
  }, [ridesFilter, allBookingsList])


  const loadData = async () => {
    setLoading(true)
    await loadStats()
    try {
      const sRes = await getStuckBookings({ minutes: 30 })
      setStuckList(sRes?.data?.data || [])
    } catch (e) { console.error(e) }

    try {
      const loc = await getLocations()
      const locData = loc?.data?.data || []
      setLocations(locData)
      setCachedLocations(locData)
    } catch (e) { console.error('Load Error', e) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  // Actions
  const handleRemoveUser = async (uId) => {
    if (!confirm('Are you sure you want to remove this user? THIS CANNOT BE UNDONE.')) return
    try {
      await api.delete(`/users/${uId}`)
      alert('User removed')
      loadData()
      setUserModalOpen(false)
    } catch (e) { alert('Failed to remove user') }
  }

  return (
    <div className="space-y-6">

      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.users}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          color="blue"
        />
        <StatCard
          title="Active Rides"
          value={stats.active}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          color="green"
          subtext="Current live bookings"
        />
        <StatCard
          title="Total Rides"
          value={stats.totalRides}
          filter={ridesFilter}
          onFilterChange={setRidesFilter}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          color="indigo"
        />
        <StatCard
          title="Pending Issues"
          value={stats.issues}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          color="red"
        />
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2 flex flex-wrap gap-2 sticky top-0 z-10">
        <TabButton active={tab === 'dashboard'} onClick={() => setTab('dashboard')} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}>
          Overview
        </TabButton>
        <TabButton active={tab === 'users'} onClick={() => setTab('users')} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}>
          Users
        </TabButton>
        <TabButton active={tab === 'active'} onClick={() => setTab('active')} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}>
          Live Rides
        </TabButton>
        <TabButton active={tab === 'manageCycles'} onClick={() => setTab('manageCycles')} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M16 10V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v5" /></svg>}>
          Cycles
        </TabButton>
        <TabButton active={tab === 'locations'} onClick={() => setTab('locations')} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>}>
          Locations
        </TabButton>
        <TabButton active={tab === 'transactions'} onClick={() => setTab('transactions')} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
          Finance
        </TabButton>
        <TabButton active={tab === 'stuck'} onClick={() => setTab('stuck')} icon={<svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}>
          Stuck ({stuckList.length})
        </TabButton>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
        {/* USERS TAB */}
        {tab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Penalty</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                          {u.fullName ? u.fullName[0] : 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{u.fullName || u.userName}</div>
                          <div className="text-xs text-slate-400">ID: {u._id.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={u.userType || 'user'} /></td>
                    <td className="px-6 py-4 text-xs font-mono">
                      {u.penaltyAmount > 0 ? <span className="text-red-600 font-bold">₹{(u.penaltyAmount / 100).toFixed(2)}</span> : <span className="text-slate-300">₹0.00</span>}
                    </td>
                    <td className="px-6 py-4">{u.email || u.phoneNumber || '—'}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => { setSelectedUser(u); setUserModalOpen(true) }} className="text-primary hover:text-primary-dark font-medium text-xs">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ACTIVE RIDES TAB */}
        {tab === 'active' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Cycle</th>
                  <th className="px-6 py-4">Start Time</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeBookingsList.map(b => (
                  <tr key={b._id} onClick={() => { setModalBooking(b); setModalOpen(true) }} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 font-medium text-slate-900">{b.user?.fullName || b.userId}</td>
                    <td className="px-6 py-4 font-mono text-xs">{b.cycle?.cycleName || b.cycleId}</td>
                    <td className="px-6 py-4">{new Date(b.startTime).toLocaleTimeString()}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-[200px] truncate">{formatLocation(b.startLocation)}</td>
                    <td className="px-6 py-4"><StatusBadge status="active" /></td>
                  </tr>
                ))}
                {activeBookingsList.length === 0 && (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">No active rides right now.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TRANSACTIONS TAB */}
        {tab === 'transactions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactionsList.map(t => (
                  <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{t.userName || t.userId}</td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-800">
                      ₹{(Number(t.amount) / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs">{t.type}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* STUCK BOOKINGS TAB */}
        {tab === 'stuck' && (
          <div className="overflow-x-auto">
            <div className="p-4 bg-red-50 text-red-700 text-sm border-b border-red-100 mb-0">
              These bookings have been in <b>pending</b> state for more than 30 minutes. They might be abandoned or have had a network failure.
            </div>
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Cycle</th>
                  <th className="px-6 py-4">Started At</th>
                  <th className="px-6 py-4">Elapsed Time</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stuckList.length === 0 && (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">No stuck bookings found. Used filter: &gt; 30 mins</td></tr>
                )}
                {stuckList.map(b => {
                  const elapsed = Math.floor((Date.now() - new Date(b.startTime).getTime()) / 60000)
                  return (
                    <tr key={b._id} onClick={() => { setModalBooking(b); setModalOpen(true) }} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                      <td className="px-6 py-4 font-medium text-slate-900">{b.user?.fullName || b.userId}</td>
                      <td className="px-6 py-4 font-mono text-xs">{b.cycle?.cycleName || b.cycleId}</td>
                      <td className="px-6 py-4">{new Date(b.startTime).toLocaleTimeString()}</td>
                      <td className="px-6 py-4">
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold text-xs animate-pulse">
                          {elapsed} mins
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-primary hover:text-primary-dark font-medium text-xs">View/Close</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* SUB COMPONENTS */}
        {tab === 'manageCycles' && <div className="p-6"><AdminCycles /></div>}
        {tab === 'locations' && <div className="p-6"><AdminLocations /></div>}

        {/* DASHBOARD OVERVIEW */}
        {tab === 'dashboard' && (
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto py-12">
              <div className="w-24 h-24 bg-slate-50 rounded-full mx-auto mb-4 flex items-center justify-center text-primary/20">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Dashboard Overview</h3>
              <p className="text-slate-500 mt-2">
                Welcome to the centralized admin control panel.
                Use the navigation tabs above to manage users, track live rides, update cycles, and view financial reports.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      {modalOpen && <BookingModal open={modalOpen} booking={modalBooking} onClose={() => setModalOpen(false)} locations={locations} />}

      {
        userModalOpen && selectedUser && (
          <Modal open={true} onClose={() => setUserModalOpen(false)} title="User Details">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-500">
                  {selectedUser.fullName ? selectedUser.fullName[0] : 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedUser.fullName}</h3>
                  <p className="text-slate-500 text-sm">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-400 uppercase">Role</div>
                  <div className="font-semibold capitalize">{selectedUser.userType}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-400 uppercase">Joined</div>
                  <div className="font-semibold">{new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg col-span-2">
                  <div className="text-xs text-slate-400 uppercase">Penalty</div>
                  <div className="font-semibold text-red-600">₹{(selectedUser.penaltyAmount / 100).toFixed(2)}</div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setUserModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Close</button>
                <button onClick={() => handleRemoveUser(selectedUser._id)} className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700">Remove User</button>
              </div>
            </div>
          </Modal>
        )
      }
    </div >
  )
}
