import React, { useEffect, useState } from 'react'
import api, { getAllUsers, getBookings, getReturnedBookings, getLocations, getActiveBookings, getTransactions, getAdminBookings, getCycles } from '../api'
import Card from '../components/Card'
import Table from '../components/Table'
import Button from '../components/Button'
import Modal from '../components/Modal'
import BookingModal from '../components/BookingModal'
import AdminLocations from './AdminLocations'
import { setCachedLocations } from '../utils/locationCache'
import AdminCycles from './AdminCycles'

export default function Admin(){
  const [tab, setTab] = useState('dashboard')
  const [usersCount, setUsersCount] = useState(null)
  const [activeBookingsCount, setActiveBookingsCount] = useState(null)
  const [returnedCount, setReturnedCount] = useState(null)
  const [activeBookings, setActiveBookings] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalBooking, setModalBooking] = useState(null)
  // users tab state
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState('all')
  const [userSort, setUserSort] = useState('default')
  const [usersList, setUsersList] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [userModalData, setUserModalData] = useState(null)
  const [activeBookingUserIds, setActiveBookingUserIds] = useState(new Set())

  // booking / cycles / transactions state
  const [bookingFilter, setBookingFilter] = useState('all')
  const [bookingFilters, setBookingFilters] = useState({ bookingId: '', userId: '', cycleId: '', location: '', userQuery: '', hasPenalty: false })
  const [bookingsList, setBookingsList] = useState([])
  const [cyclesList, setCyclesList] = useState([])
  const [returnedList, setReturnedList] = useState([])
  const [stuckList, setStuckList] = useState([])
  const [transactionsList, setTransactionsList] = useState([])
  const [transactionModalOpen, setTransactionModalOpen] = useState(false)
  const [transactionModalData, setTransactionModalData] = useState(null)

  const formatDate = (d) => d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'

  // load users for Users tab
  const loadUsers = async () => {
    try{
      const res = await getAllUsers()
      const list = res?.data?.data || []
      setUsersList(list)
    }catch(e){ console.error('Failed to load users', e); setUsersList([]) }
  }

  // keep filteredUsers derived from usersList, search and filters
  useEffect(()=>{
    let list = Array.isArray(usersList) ? usersList.slice() : []
    // search
    if(userSearch && userSearch.trim()){
      const q = userSearch.trim().toLowerCase()
      list = list.filter(u => (u.fullName || u.userName || u.email || '').toLowerCase().includes(q))
    }
    // filter by penalty / active
    if(userFilter === 'penalty') list = list.filter(u => (u.penaltyAmount || 0) > 0)
    if(userFilter === 'active') list = list.filter(u => activeBookingUserIds.has(String(u._id)))

    // sort
    if(userSort === 'rides-desc') list = list.sort((a,b)=> (b.totalRides||0) - (a.totalRides||0))
    if(userSort === 'rides-asc') list = list.sort((a,b)=> (a.totalRides||0) - (b.totalRides||0))

    setFilteredUsers(list)
  }, [usersList, userSearch, userFilter, userSort, activeBookingUserIds])

  const handleViewUser = async (u) => {
    setUserModalOpen(true)
    setUserModalData({ user: u, bookings: [] })
    try{
      const res = await getBookings({ userId: u._id })
      setUserModalData({ user: u, bookings: res?.data?.data || [] })
    }catch(e){ console.error('Failed to load user bookings', e) }
  }

  const handleRemoveUser = async (u) => {
    if(!confirm('Remove user?')) return
    try{
      await api.delete(`/user/${u._id}`)
      await loadUsers()
      alert('User removed')
    }catch(e){ alert(e?.response?.data?.message || 'Failed to remove user') }
  }

    useEffect(()=>{
      loadStats()
      loadActiveBookings()
      loadLocations()
    }, [])

    // react to tab changes: load data for respective tab
    useEffect(()=>{
      if(tab === 'users') loadUsers()
      if(tab === 'bookings') loadAllBookings()
      if(tab === 'returned') loadReturned()
      if(tab === 'stuck') loadStuck()
      if(tab === 'transactions') loadTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab])

    const loadStats = async ()=>{
      try{
        if(tab === 'bookings') { loadCycles(); loadUsers() }
        const u = await getAllUsers()
        setUsersCount(Array.isArray(u?.data?.data) ? u.data.data.length : 0)

        // active bookings count
        const act = await getActiveBookings()
        setActiveBookingsCount(Array.isArray(act?.data?.data) ? act.data.data.length : 0)

        const r = await getReturnedBookings({ limit: 1 })
        setReturnedCount(r?.data?.data ? (Array.isArray(r.data.data) ? r.data.data.length : 1) : 0)
      }catch(e){ console.error(e) }
    }

  const loadActiveBookings = async ()=>{
    setLoading(true)
    try{
      // fetch active bookings from backend (top source of truth for active rides)
      const res = await getActiveBookings()
      let data = res?.data?.data || []
      // sort by startTime desc (newest first)
      data = data.sort((a,b)=> new Date(b.startTime) - new Date(a.startTime))
      // store for dashboard (limit to top 10)
      setActiveBookings(data.slice(0,10))
    }catch(e){ console.error(e); setActiveBookings([]) }
    finally{ setLoading(false) }
  }

  // Fetch active bookings user ids for user filters when needed
  const fetchActiveBookingUserIds = async ()=>{
    try{
      const res = await getActiveBookings()
      const data = res?.data?.data || []
      const ids = new Set(data.map(b => String(b.userId || b.user?._id || (b.user && b.user.userId) || '')))
      setActiveBookingUserIds(ids)
    }catch(e){ console.error('Failed to fetch active bookings for user filter', e); setActiveBookingUserIds(new Set()) }
  }

  // when userFilter switches to 'active' ensure we have the active booking user ids
  React.useEffect(()=>{
    if(tab === 'users' && userFilter === 'active') fetchActiveBookingUserIds()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, userFilter])

  const loadLocations = async ()=>{
    try{
      const res = await getLocations()
      const list = res?.data?.data || []
      setLocations(list)
      try{ setCachedLocations(list) }catch(e){}
    }catch(e){ console.error(e) }
  }

  const loadCycles = async ()=>{
    try{
      const res = await getCycles()
      setCyclesList(res?.data?.data || [])
    }catch(e){ console.error(e); setCyclesList([]) }
  }

  const loadAllBookings = async () => {
    try{
      const res = await getAdminBookings()
      setBookingsList(res?.data?.data || [])
    }catch(e){ console.error('Failed to load bookings', e); setBookingsList([]) }
  }

  const loadReturned = async () => {
    try{
      const res = await getReturnedBookings({ limit: 200 })
      setReturnedList(res?.data?.data || [])
    }catch(e){ console.error('Failed to load returned list', e); setReturnedList([]) }
  }

  const loadStuck = async () => {
    try{
      // placeholder: no dedicated API for stuck in this file; keep empty or implement when available
      setStuckList([])
    }catch(e){ setStuckList([]) }
  }

  const loadTransactions = async () => {
    try{
      const res = await getTransactions()
      setTransactionsList(res?.data?.data || [])
    }catch(e){ console.error('Failed to load transactions', e); setTransactionsList([]) }
  }

  const columns = [
    { header: 'ID', accessor: '_id', render: row => `#${String(row._id).slice(0,8)}` },
    { header: 'User', accessor: 'user', render: row => row.user?.fullName || row.user?.userName || row.userId || '-' },
    { header: 'Date', accessor: 'startTime', render: row => formatDate(row.startTime) }
  ]

  const formatDateTime = (d) => d ? new Date(d).toLocaleString() : '-'

  const durationFrom = (start) => {
    if(!start) return '-'
    const diffMs = Date.now() - new Date(start).getTime()
    const mins = Math.floor(diffMs / 60000)
    if(mins < 60) return `${mins}m`
    const h = Math.floor(mins/60)
    const m = mins % 60
    return `${h}h ${m}m`
  }

  const bookingStatus = (b) => {
    // derive status: Near End if estimatedEndTime within 10 mins, Delayed if actualEndTime passed (or elapsed > estimated), else Ongoing
    try{
      const now = Date.now()
      const estEnd = b.estimatedEndTime ? new Date(b.estimatedEndTime).getTime() : null
      const start = b.startTime ? new Date(b.startTime).getTime() : null
      if(estEnd && now > estEnd) return { label: 'Delayed', color: 'bg-red-600' }
      if(estEnd && (estEnd - now) <= 10 * 60 * 1000) return { label: 'Near End', color: 'bg-yellow-500' }
      return { label: 'Ongoing', color: 'bg-green-600' }
    }catch(e){ return { label: b.status || 'Ongoing', color: 'bg-gray-500' } }
  }

  const openBookingModal = (b)=>{ setModalBooking(b); setModalOpen(true) }

  // Safe renderer for a location value which may be a string, an object with { name, address }
  // or a GeoJSON-like point { type, coordinates }.
  const renderLocationSafe = (loc) => {
    if(!loc && loc !== 0) return '—'
    if(typeof loc === 'string') return loc
    // if it's an object and has a human name
    if(loc && typeof loc === 'object'){
      if(loc.name) return loc.name
      if(loc.address) return loc.address
      // GeoJSON Point: coordinates may be [lng, lat] or { coordinates: [lng, lat] }
      const coords = Array.isArray(loc.coordinates) ? loc.coordinates : (loc.coordinates && Array.isArray(loc.coordinates.coordinates) ? loc.coordinates.coordinates : null)
      if(coords && coords.length >= 2){
        // show lat, lng rounded
        const [lng, lat] = coords
        return `${lat?.toFixed(5)}, ${lng?.toFixed(5)}`
      }
      // fallback to stringified object
      try{ return JSON.stringify(loc) }catch(e){ return '—' }
    }
    return String(loc)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 h-full">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
        {/* Sidebar */}
        <aside className="col-span-1">
          <div className="bg-white/5 rounded-lg p-4 sticky top-6 max-h-[calc(100vh-4rem)] overflow-auto hide-scrollbar">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center font-bold">CR</div>
              <div className="font-semibold">CampusRide</div>
            </div>
            <nav className="space-y-3 text-sm">
              <button onClick={()=>setTab('dashboard')} className={`w-full text-left px-3 py-2 rounded ${tab==='dashboard' ? 'bg-sky-50/10 text-sky-100 font-medium' : 'hover:bg-white/5'}`}>Dashboard</button>
              <button onClick={()=>setTab('users')} className={`w-full text-left px-3 py-2 rounded ${tab==='users' ? 'bg-sky-50/10 text-sky-100 font-medium' : 'hover:bg-white/5'}`}>Users</button>
              <button onClick={()=>setTab('bookings')} className={`w-full text-left px-3 py-2 rounded ${tab==='bookings' ? 'bg-sky-50/10 text-sky-100 font-medium' : 'hover:bg-white/5'}`}>Bookings</button>
              <button onClick={()=>setTab('returned')} className={`w-full text-left px-3 py-2 rounded ${tab==='returned' ? 'bg-sky-50/10 text-sky-100 font-medium' : 'hover:bg-white/5'}`}>Returned</button>
              <button onClick={()=>setTab('stuck')} className={`w-full text-left px-3 py-2 rounded ${tab==='stuck' ? 'bg-sky-50/10 text-sky-100 font-medium' : 'hover:bg-white/5'}`}>Stuck</button>
              <button onClick={()=>setTab('transactions')} className={`w-full text-left px-3 py-2 rounded ${tab==='transactions' ? 'bg-sky-50/10 text-sky-100 font-medium' : 'hover:bg-white/5'}`}>Transactions</button>
              <hr className="my-2" />
              <button onClick={()=>setTab('manageCycles')} className={`w-full text-left px-3 py-2 rounded ${tab==='manageCycles' ? 'bg-sky-50/10 text-sky-100 font-medium' : 'hover:bg-white/5'}`}>Manage Cycles</button>
              <button onClick={()=>setTab('locations')} className={`w-full text-left px-3 py-2 rounded ${tab==='locations' ? 'bg-sky-50/10 text-sky-100 font-medium' : 'hover:bg-white/5'}`}>Manage Locations</button>
            </nav>
          </div>
        </aside>

  {/* Main content */}
  <main className="col-span-1 md:col-span-3 max-h-[calc(100vh-4rem)] overflow-auto hide-scrollbar">
          {tab === 'dashboard' ? (
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
                <p className="text-gray-400 mb-6">Overview of users, bookings and returns</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <div className="text-2xl font-semibold">{usersCount ?? '—'}</div>
                    <div className="text-sm text-gray-400">Users</div>
                  </Card>
                  <Card>
                    <div className="text-2xl font-semibold">{activeBookingsCount ?? '—'}</div>
                    <div className="text-sm text-gray-400">Active Bookings</div>
                  </Card>
                  <Card>
                    <div className="text-2xl font-semibold">{returnedCount ?? '—'}</div>
                    <div className="text-sm text-gray-400">Returned</div>
                  </Card>
                </div>

                {/* Active Bookings card */}
                <div className="bg-gradient-to-r from-indigo-900 to-blue-900 rounded-xl p-4 text-gray-200 shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">Active Bookings</h3>
                    <div className="text-sm text-indigo-100">Top {activeBookings.length} • Updated</div>
                  </div>

                  {loading ? (
                    <div className="text-gray-300">Loading active bookings...</div>
                  ) : activeBookings.length === 0 ? (
                    <div className="flex items-center gap-3 p-6 rounded-md bg-white/5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6" /></svg>
                      <div>No ongoing rides currently.</div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-md hide-scrollbar">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-sm text-indigo-100">
                            <th className="px-3 py-2">ID</th>
                            <th className="px-3 py-2">User</th>
                            <th className="px-3 py-2">Cycle</th>
                            <th className="px-3 py-2">Start Time</th>
                            <th className="px-3 py-2">Duration</th>
                            <th className="px-3 py-2">Location</th>
                            <th className="px-3 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeBookings.map((b, idx) => {
                            const st = bookingStatus(b)
                            return (
                              <tr key={b._id || idx} onClick={()=>openBookingModal(b)} className="border-t cursor-pointer hover:bg-white/5 transition">
                                <td className="px-3 py-2 text-xs">{String(b._id).slice(0,8)}</td>
                                <td className="px-3 py-2 text-xs">{b.user?.fullName || b.user?.userName || (b.userId ? String(b.userId).slice(0,8) : '-')}</td>
                                <td className="px-3 py-2 text-xs">{b.cycle?.cycleNumber || b.cycle?.cycleName || (b.cycleId ? String(b.cycleId).slice(0,8) : '-')}</td>
                                <td className="px-3 py-2 text-xs">{formatDateTime(b.startTime)}</td>
                                <td className="px-3 py-2 text-xs">{durationFrom(b.startTime)}</td>
                                <td className="px-3 py-2 text-xs">{b.endLocation?.name || b.startLocation?.name || b.location || renderLocationSafe(b.endLocation || b.location || b.startLocation)}</td>
                                <td className="px-3 py-2 text-sm">
                                  <span className={`inline-block px-2 py-1 rounded text-xs ${st.color}`}>{st.label}</span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Illustration on the right */}
              <div className="hidden lg:block w-96">
                <img src="/assets/admin-hero.svg" alt="Campus illustration" className="rounded-lg shadow-md" />
              </div>
            </div>
          ) : (
            <div>
              {tab === 'users' && (
                <Card>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Users</h3>
                    <div className="flex items-center gap-3">
                      <input value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Search name or email" className="bg-white/5 placeholder-gray-300 text-sm px-2 py-1 rounded" />
                      <div className="flex items-center gap-2">
                        <div className="flex rounded bg-white/5 p-1">
                          <button onClick={()=>setUserFilter('all')} className={`px-3 py-1 text-sm ${userFilter==='all' ? 'bg-white/10 font-medium' : ''}`}>All</button>
                          <button onClick={()=>setUserFilter('penalty')} className={`px-3 py-1 text-sm ${userFilter==='penalty' ? 'bg-white/10 font-medium' : ''}`}>Has Penalty</button>
                          <button onClick={()=>setUserFilter('active')} className={`px-3 py-1 text-sm ${userFilter==='active' ? 'bg-white/10 font-medium' : ''}`}>Has Active Booking</button>
                        </div>
                        <select value={userSort} onChange={e=>setUserSort(e.target.value)} className="bg-white/5 px-2 py-1 rounded text-sm">
                          <option value="default">Sort: Default</option>
                          <option value="rides-desc">Most Rides</option>
                          <option value="rides-asc">Least Rides</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {filteredUsers.length===0 ? (
                    <div className="text-gray-400">No users found</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredUsers.map(u => (
                        <div key={u._id} onClick={()=>handleViewUser(u)} className="backdrop-blur-sm bg-white/6 border border-white/6 rounded-xl p-3 hover:shadow-2xl hover:-translate-y-1 transition transform cursor-pointer">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-lg text-white truncate">{u.userName || u.fullName || 'User'}</div>
                              <div className="text-sm text-gray-300 truncate">{u.role || 'User'}</div>
                            </div>

                            <div className="flex-shrink-0 flex flex-col items-end gap-2">
                              <div className="text-sm text-red-300 font-medium">₹{u.penaltyAmount || 0}</div>
                              <div className="text-xs text-gray-400">Penalty</div>
                              <div className="mt-2">
                                <button onClick={(e)=>{ e.stopPropagation(); handleRemoveUser(u) }} className="px-2 py-1 bg-red-600 text-white rounded text-xs whitespace-nowrap">Remove</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {userModalOpen && (
                    <Modal open={true} title={`User: ${userModalData?.user?.fullName || userModalData?.user?.userName || ''}`} onClose={()=>{ setUserModalOpen(false); setUserModalData(null) }}>
                      <div className="text-sm">
                        <div className="mb-2"><strong>Email:</strong> {userModalData?.user?.email}</div>
                        <div className="mb-2"><strong>Total Rides:</strong> {userModalData?.bookings?.length || 0}</div>
                        <div className="mb-2"><strong>Active Penalty:</strong> <span className={`${(userModalData?.user?.penaltyAmount || 0) > 0 ? 'text-red-300' : 'text-gray-300'}`}>₹{userModalData?.user?.penaltyAmount || 0}</span></div>

                        <h4 className="font-semibold mt-3">Recent Bookings</h4>
                        <div className="mt-2 space-y-2">
                          {userModalData?.bookings?.length===0 ? (
                            <div className="text-gray-500 text-sm">No bookings</div>
                          ) : (
                            userModalData.bookings.map(b => (
                              <div key={b._id} className="p-2 border rounded bg-white/5 text-xs">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="font-medium">#{String(b._id).slice(0,8)} • <span className="text-gray-300">{b.status}</span></div>
                                  <div className={`px-2 py-0.5 rounded text-[10px] ${b.penaltyAmount && b.penaltyAmount>0 ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-200'}`}>₹{b.penaltyAmount || 0}</div>
                                </div>
                                <div className="text-xs text-gray-300">Start: <span className="text-white">{renderLocationSafe(b.startLocation)}</span></div>
                                <div className="text-xs text-gray-300">Destination: <span className="text-white">{renderLocationSafe(b.endLocation)}</span></div>
                                <div className="text-xs text-gray-400 mt-1">Started: {formatDateTime(b.startTime)}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </Modal>
                  )}
                </Card>
              )}

              {tab === 'bookings' && (
                <div className="relative">
                  <Card>
                    <div className="flex flex-col gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex rounded bg-white/5 p-1">
                        {['all','ongoing','completed','cancelled'].map(f=> (
                          <button key={f} onClick={()=>setBookingFilter(f)} className={`px-3 py-1 text-sm ${bookingFilter===f ? 'bg-white/10 font-medium' : ''}`}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
                        ))}
                      </div>
                      <div className="ml-4 text-sm text-gray-300">Filters:</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input placeholder="Booking ID" value={bookingFilters.bookingId} onChange={e=>setBookingFilters(s=>({...s, bookingId: e.target.value}))} className="bg-white/5 px-2 py-1 rounded text-sm" />

                      <input placeholder="User name or ID" value={bookingFilters.userQuery} onChange={e=>setBookingFilters(s=>({...s, userQuery: e.target.value}))} className="bg-white/5 px-2 py-1 rounded text-sm" />

                      <select value={bookingFilters.userId} onChange={e=>setBookingFilters(s=>({...s, userId: e.target.value}))} className="bg-white/5 px-2 py-1 rounded text-sm">
                        <option value="">All Users</option>
                        {usersList.map(u => <option key={u._id} value={u._id}>{u.fullName || u.userName}</option>)}
                      </select>

                      <select value={bookingFilters.cycleId} onChange={e=>setBookingFilters(s=>({...s, cycleId: e.target.value}))} className="bg-white/5 px-2 py-1 rounded text-sm">
                        <option value="">All Cycles</option>
                        {cyclesList.map(c => <option key={c._id} value={c._id}>{c.cycleNumber || c.cycleName || String(c._id).slice(0,6)}</option>)}
                      </select>


                      <select value={bookingFilters.location} onChange={e=>setBookingFilters(s=>({...s, location: e.target.value}))} className="bg-white/5 px-2 py-1 rounded text-sm">
                        <option value="">All Locations</option>
                        {locations.map(l => <option key={l._id} value={l.name || `${(l.coordinates?.coordinates || l.coordinates || []).join(',')}`}>{l.name || (l.coordinates && l.coordinates.coordinates ? `${l.coordinates.coordinates[1].toFixed(4)}, ${l.coordinates.coordinates[0].toFixed(4)}` : String(l._id).slice(0,6))}</option>)}
                      </select>

                      <button onClick={()=>setBookingFilters(s=>({...s, hasPenalty: !s.hasPenalty}))} className={`px-3 py-1 text-sm ${bookingFilters.hasPenalty ? 'bg-white/10 font-medium' : 'bg-white/5'}`}>{bookingFilters.hasPenalty ? 'Has Penalty: ON' : 'Has Penalty'}</button>

                      <div className="flex items-center gap-2 ml-2">
                        <button onClick={()=>loadAllBookings()} className="px-3 py-1 bg-sky-600 text-white rounded text-sm">Apply</button>
                        <button onClick={()=>{ setBookingFilters({ bookingId: '', userId: '', cycleId: '', location: '' }); setBookingFilter('all'); loadAllBookings(); }} className="px-3 py-1 bg-white/5 text-sm rounded">Clear</button>
                      </div>
                    </div>
                    </div>
                  </Card>
                  {/* background image + gradient overlay */}
                  <div className="absolute inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: "url('/assets/illustration.svg')" }} />
                  <div className="absolute inset-0 -z-5 bg-gradient-to-b from-[#0b1530]/80 to-[#1b2a60]/80" />

                  <div className="relative">
                    <h3 className="text-3xl font-semibold mb-6 text-white">Bookings</h3>

                    {bookingsList.length === 0 ? (
                      <Card>
                        <div className="text-gray-400">No bookings found</div>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                        {(bookingsList.filter(b => {
                          // status filter
                          if(bookingFilter === 'ongoing' && !(b.status === 'pending' || b.status === 'ongoing')) return false
                          if(bookingFilter === 'completed' && !(b.status === 'completed' || b.status === 'returned')) return false
                          if(bookingFilter === 'cancelled' && !(b.status === 'canceled' || b.status === 'cancelled')) return false

                          // booking id filter
                          if(bookingFilters.bookingId && !String(b._id).includes(String(bookingFilters.bookingId))) return false

                          // user select filter
                          if(bookingFilters.userId && String(b.userId || b.user?._id || '') !== String(bookingFilters.userId)) return false

                          // user query (name or id)
                          if(bookingFilters.userQuery && bookingFilters.userQuery.trim()){
                            const q = bookingFilters.userQuery.trim().toLowerCase()
                            const userName = (b.user?.fullName || b.user?.userName || '').toLowerCase()
                            const userIdStr = String(b.userId || b.user?._id || '').toLowerCase()
                            if(!userName.includes(q) && !userIdStr.includes(q)) return false
                          }

                          // cycle filter
                          if(bookingFilters.cycleId && String(b.cycleId || b.cycle?._id || '') !== String(bookingFilters.cycleId)) return false

                          // location filter (match against startLocation name/address or coordinates string)
                          if(bookingFilters.location){
                            const startLoc = b.startLocation || {}
                            const locName = (startLoc.name || startLoc.address || (Array.isArray(startLoc.coordinates) ? startLoc.coordinates.join(',') : '') || '').toString().toLowerCase()
                            if(!locName.includes(String(bookingFilters.location).toLowerCase())) return false
                          }

                          // penalty filter
                          if(bookingFilters.hasPenalty){ if(!(b.penaltyAmount && b.penaltyAmount > 0)) return false }

                          return true
                        })).map(b => {
                          const userName = b.user?.fullName || b.user?.userName || (b.user && b.user.userName) || 'Unknown'
                          const cycleName = b.cycle?.cycleName || b.cycle?.cycleNumber || (b.cycle && b.cycle.cycleNumber) || '—'
                          const startLocName = renderLocationSafe(b.startLocation || b.startLocation?.coordinates || b.startLocation?.address || b.startLocation?.name)
                          const endLocName = renderLocationSafe(b.endLocation || b.endLocation?.coordinates || b.endLocation?.address || b.endLocation?.name)
                          const statusClass = b.status === 'completed' ? 'bg-emerald-600 text-white' : b.status === 'pending' ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'

                          return (
                            <div key={b._id} onClick={()=>openBookingModal(b)} className="backdrop-blur-sm bg-white/6 border border-white/6 rounded-xl p-4 hover:shadow-2xl hover:-translate-y-1 transition transform cursor-pointer">
                              <div className="flex items-start justify-between mb-2">
                                <div className="text-sm text-slate-200">#{String(b._id).slice(0,8)}</div>
                                <div>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>{b.status}</span>
                                </div>
                              </div>

                              <div className="font-semibold text-lg text-white mb-1">{userName}</div>
                              <div className="text-xs text-slate-200 mb-2">Cycle: {cycleName}</div>

                              <div className="text-xs text-slate-300">From: <span className="font-medium text-slate-100">{b.startLocation?.name || startLocName}</span></div>
                              <div className="text-xs text-slate-300">To: <span className="font-medium text-slate-100">{b.endLocation?.name || endLocName}</span></div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === 'returned' && (
                <Card>
                  <h3 className="font-semibold mb-3">Returned</h3>
                  {returnedList.length===0 ? <div className="text-gray-400">No returned bookings</div> : (
                    <div className="w-full overflow-x-auto hide-scrollbar">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-sm text-gray-300">
                            <th className="px-3 py-2">Cycle</th>
                            <th className="px-3 py-2">User</th>
                            <th className="px-3 py-2">Returned Time</th>
                            <th className="px-3 py-2">Duration</th>
                            <th className="px-3 py-2">Penalty</th>
                            <th className="px-3 py-2">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {returnedList.map(r => {
                            const userName = r.user?.fullName || r.user?.userName || r.userId || '-'
                            const cycleName = r.cycle?.cycleNumber || r.cycle?.cycleName || r.cycleId || '-'
                            const returnedAt = r.actualEndTime ? new Date(r.actualEndTime).toLocaleString() : '-'
                            const duration = (r.startTime && r.actualEndTime) ? (()=>{
                              const diff = new Date(r.actualEndTime).getTime() - new Date(r.startTime).getTime()
                              const mins = Math.round(diff/60000)
                              if(mins < 60) return `${mins}m`
                              return `${Math.floor(mins/60)}h ${mins%60}m`
                            })() : '-'
                            return (
                              <tr key={r._id} className={`hover:bg-white/5 ${r.penaltyAmount && r.penaltyAmount>0 ? 'bg-red-50/20' : ''}`}>
                                <td className="px-3 py-2 text-sm">{cycleName}</td>
                                <td className="px-3 py-2 text-sm">{userName}</td>
                                <td className="px-3 py-2 text-sm">{returnedAt}</td>
                                <td className="px-3 py-2 text-sm">{duration}</td>
                                <td className="px-3 py-2 text-sm">₹{r.penaltyAmount || 0}</td>
                                <td className="px-3 py-2 text-sm">
                                  <button onClick={async ()=>{
                                    if(!confirm('Mark this return as verified?')) return
                                    try{
                                      const res = await api.patch(`/guard/mark-received/${r._id}`)
                                      alert('Marked as verified')
                                      loadReturned()
                                    }catch(e){ alert(e?.response?.data?.message || 'Failed to mark verified') }
                                  }} className="px-2 py-1 bg-sky-600 text-white rounded text-xs">Mark as Verified</button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              )}

              {tab === 'stuck' && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Stuck / Reported Issues</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stuckList.length===0 && <div className="text-gray-400">No issues reported</div>}
                    {stuckList.map(s => (
                      <div key={s._id} className="p-3 rounded-lg border-l-4 border-orange-400 bg-white/5 max-h-40 overflow-auto hide-scrollbar text-xs">
                        <div className="mb-2">
                          <div className="font-medium text-sm truncate">Cycle: {s.cycle?.cycleNumber || s.cycleId || '-'}</div>
                          <div className="text-[11px] text-gray-300">Status: {s.status || 'pending'}</div>
                        </div>

                        <div className="mb-2">
                          <div className="text-[11px] text-gray-300">Reported by:</div>
                          <div className="text-[12px] text-white truncate">{s.user?.fullName || s.user?.userName || s.userId || '-'}</div>
                        </div>

                        <div className="mb-3 text-[12px] text-gray-200 whitespace-pre-wrap">{s.issue || s.description || 'No description provided'}</div>

                        <div className="flex items-center gap-2">
                          <button onClick={async ()=>{
                            if(!confirm('Mark as resolved?')) return
                            try{
                              // try to cancel booking as a fallback; may require proper permissions
                              await api.patch(`/booking/${s._id}/cancel`)
                              alert('Marked resolved (backend action attempted)')
                              loadStuck()
                            }catch(e){ alert(e?.response?.data?.message || 'Failed to resolve') }
                          }} className="px-2 py-1 bg-emerald-600 text-white rounded text-xs">Resolve</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'transactions' && (
                <Card>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Transactions</h3>
                    <div>
                      <button onClick={()=>{
                        if(!transactionsList || transactionsList.length===0) return alert('No transactions to export')
                        const rows = [['Transaction ID','User','Amount','Type','Date']]
                        transactionsList.forEach(t => rows.push([String(t._id), t.userName || (t.user && (t.user.fullName || t.user.userName)) || t.userId || '', (Number(t.amount||0)/100).toFixed(2), t.type || t.description || '', new Date(t.createdAt || t.date || Date.now()).toLocaleString()]))
                        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
                        const blob = new Blob([csv], { type: 'text/csv' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `transactions_${Date.now()}.csv`
                        a.click()
                        URL.revokeObjectURL(url)
                      }} className="px-3 py-1 bg-sky-600 text-white rounded text-sm">Download CSV</button>
                    </div>
                  </div>

                  {transactionsList.length===0 ? <div className="text-gray-400">No transactions</div> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {transactionsList.map(t => {
                        const userLabel = t.userName || (t.user && (t.user.fullName || t.user.userName)) || t.userId || '-' 
                        const amountR = (t.amount || 0)
                        const amountRupees = (Number(amountR) / 100).toFixed(2)
                        const when = new Date(t.createdAt || t.date || Date.now()).toLocaleString()
                        return (
                          <div key={t._id} onClick={()=>{ setTransactionModalData(t); setTransactionModalOpen(true) }} className="backdrop-blur-sm bg-white/6 border border-white/6 rounded-xl p-4 hover:shadow-2xl hover:-translate-y-1 transition transform cursor-pointer">
                            <div className="flex items-start justify-end mb-2">
                              <div className="text-xs text-gray-400">{t.type || t.description || ''}</div>
                            </div>

                            <div className="font-semibold text-lg text-white mb-1">{userLabel}</div>
                            <div className="text-sm text-slate-200 mb-2">₹{amountRupees}</div>
                            <div className="text-xs text-gray-300">{when}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {transactionModalOpen && (
                    <Modal open={true} title={`Transaction: #${String(transactionModalData?._id || '').slice(0,8)}`} onClose={() => { setTransactionModalOpen(false); setTransactionModalData(null) }}>
                      <div className="text-sm space-y-2">
                        <div><strong>ID:</strong> {transactionModalData?._id}</div>
                        <div><strong>User:</strong> {transactionModalData?.userName || (transactionModalData?.user && (transactionModalData.user.fullName || transactionModalData.user.userName)) || transactionModalData?.userId || '-'}</div>
                        <div><strong>Amount:</strong> ₹{(Number(transactionModalData?.amount || 0)/100).toFixed(2)}</div>
                        <div><strong>Type:</strong> {transactionModalData?.type || transactionModalData?.description || '-'}</div>
                        <div><strong>Date:</strong> {new Date(transactionModalData?.createdAt || transactionModalData?.date || Date.now()).toLocaleString()}</div>
                        {transactionModalData?.meta && <div><strong>Meta:</strong> <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(transactionModalData.meta, null, 2)}</pre></div>}
                      </div>
                    </Modal>
                  )}
                </Card>
              )}

              {tab === 'manageCycles' && <AdminCycles />}
              {tab === 'locations' && <AdminLocations />}
            </div>
          )}
        </main>
      </div>
      {/* Booking details modal */}
  <BookingModal open={modalOpen} booking={modalBooking} onClose={()=>setModalOpen(false)} locations={locations} />
    </div>
  )
}
