import React, { useEffect, useState } from 'react'
import api, { getUser, getCycles, getBookings, getReturnedBookings, getLocations, getAvailableCycles, getActiveBookings, settlePenalty } from '../api'
import AdminLocations from './AdminLocations'
import AdminCycles from './AdminCycles'

export default function Admin(){
  // Helper: format amount stored in paise to rupees with symbol
  const formatRupees = (paise) => {
    if (paise === null || paise === undefined) return 'N/A';
    const n = Number(paise);
    console.log("smount",n)
    if (Number.isNaN(n)) return String(paise);
    // Convert paise to rupees and format to 2 decimal places
    return `₹${(n / 10000).toFixed(2)}`;
  }

  const [tab, setTab] = useState('users')
  const [filter, setFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [cycleFilter, setCycleFilter] = useState('')
  const [bookingFilter, setBookingFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [locations, setLocations] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [minutesFilter, setMinutesFilter] = useState('30')

  useEffect(()=>{
    // When tab changes, reset items and load fresh data without previous filters
    load({ reset: true })
    loadLocations()
  }, [tab])

  const resetAllFilters = ()=>{
    setFilter('')
    setUserFilter('')
    setLocationFilter('')
    setCycleFilter('')
    setBookingFilter('')
    setStatusFilter('')
    setActiveOnly(false)
  }

  const changeTab = (newTab) =>{
    // clear UI filters and results immediately
    resetAllFilters()
    setItems([])
    setTab(newTab)
  }

  const handleAdminPayPenalty = async (userId) => {
    const amount = prompt('Enter amount to pay for user:')
    if(!amount) return
    try{
      const res = await settlePenalty(userId, { amountPaid: Number(amount) })
      if(res?.data?.statusCode===200 || res?.data?.success){
        const updated = res.data.data
        setItems(prev => prev.map(it => (it._id===updated._id ? updated : it)))
        alert('Penalty updated')
      }
    }catch(e){ alert(e?.response?.data?.message || 'Failed to update penalty') }
  }

  const loadLocations = async ()=>{
    try{
      const res = await getLocations()
      setLocations(res?.data?.data || [])
    }catch(e){ console.error(e) }
  }
  

  const load = async (opts = {})=>{
    setLoading(true)
    try{
      if(tab === 'users') await loadUsers(opts)
      else if(tab === 'cycles') await loadCycles(opts)
      else if(tab === 'bookings') await loadBookings(opts)
      else if(tab === 'stuck') await loadStuck(opts)
      else if(tab === 'returned') await loadReturned(opts)
      else if(tab === 'transactions') await loadTransactions(opts)
      // 'locations' and 'manageCycles' are separate components and manage their own loading
    }
    catch(e){ console.error(e) }
    finally{ setLoading(false) }
  }

  // Per-tab loaders
  const loadUsers = async (opts = {})=>{
    // If admin wants list of all users (no userFilter), call dedicated admin endpoint
    if(opts?.reset || !userFilter){
      const res = await api.get('/user/all')
      setItems(res?.data?.data || [])
    } else {
      const q = userFilter
      const res = await getUser(q)
      if(res?.data?.statusCode===200 || res?.data?.success){
        const d = res.data.data
        setItems(Array.isArray(d)? d : (d ? [d] : []))
      } else setItems([])
    }
  }

  const loadCycles = async (opts = {})=>{
    // If searching by cycle id, ignore other filters
    if(!opts?.reset && cycleFilter){
      const res = await getCycles({ cycleId: cycleFilter })
      setItems(res?.data?.data ? (Array.isArray(res.data.data)? res.data.data : [res.data.data]) : [])
    } else if(!opts?.reset && statusFilter === 'available'){
      // use the dedicated available cycles controller
      // send location name as 'location' so backend geoCoding middleware handles it
      const res = await getAvailableCycles(locationFilter ? { location: locationFilter } : {})
      setItems(res?.data?.data || [])
    } else {
      const params = {}
      if(!opts?.reset){
        if(locationFilter) params.location = locationFilter
        if(statusFilter) params.status = statusFilter
      }
      const res = await getCycles(Object.keys(params).length ? params : {})
      setItems(res?.data?.data || [])
    }
  }

  const loadBookings = async (opts = {})=>{
    // bookingFilter is bookingId (highest precedence)
    if(!opts?.reset && bookingFilter){
      const res = await getBookings({ bookingId: bookingFilter })
      setItems(res?.data?.data || [])
    } else {
      const params = {}
      if(!opts?.reset){
        if(cycleFilter) params.cycleId = cycleFilter
        if(userFilter) params.userId = userFilter
        if(locationFilter) params.location = locationFilter
        if(activeOnly){
          // use active bookings controller
          const res = await getActiveBookings(Object.keys(params).length ? params : {})
          setItems(res?.data?.data || [])
          return
        }
      } else {
        // opts.reset -> fetch all bookings unfiltered
      }
      const res = await getBookings(Object.keys(params).length ? params : {})
      setItems(res?.data?.data || [])
    }
  }

  const loadReturned = async (opts = {})=>{
    if(!opts?.reset && bookingFilter){
      const res = await getBookings({ bookingId: bookingFilter })
      setItems(res?.data?.data || [])
    } else {
      const params = {}
      if(!opts?.reset){
        if(userFilter) params.userId = userFilter
        if(locationFilter) params.location = locationFilter
      }
      const res = await getReturnedBookings(Object.keys(params).length ? params : {})
      setItems(res?.data?.data || [])
    }
  }

  const loadTransactions = async ()=>{
    // not implemented endpoint in frontend api for transactions; attempt a direct call
    const res = await api.get('/transaction')
    setItems(res?.data?.data || [])
  }

  const loadStuck = async (opts = {})=>{
    try{
      const minutes = Number(minutesFilter) || 30
      const params = { minutes }
      if(locationFilter) params.location = locationFilter
      const res = await api.get('/booking/stuck', { params })
      setItems(res?.data?.data || [])
    }catch(e){ console.error(e); setItems([]) }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Admin Dashboard</h2>
      <div className="mb-3 flex flex-wrap items-center">
        {/* Filter/search related tabs grouped together */}
        <div className="flex items-center gap-2">
          <button className={`px-3 py-1 rounded ${tab==='users'? 'bg-indigo-600 text-white':'bg-gray-200'}`} onClick={()=>changeTab('users')}>Users</button>
          <button className={`px-3 py-1 rounded ${tab==='bookings'? 'bg-indigo-600 text-white':'bg-gray-200'}`} onClick={()=>changeTab('bookings')}>Bookings</button>
          <button className={`px-3 py-1 rounded ${tab==='stuck'? 'bg-indigo-600 text-white':'bg-gray-200'}`} onClick={()=>changeTab('stuck')}>Stuck</button>
          <button className={`px-3 py-1 rounded ${tab==='returned'? 'bg-indigo-600 text-white':'bg-gray-200'}`} onClick={()=>changeTab('returned')}>Returned</button>
          <button className={`px-3 py-1 rounded ${tab==='transactions'? 'bg-indigo-600 text-white':'bg-gray-200'}`} onClick={()=>changeTab('transactions')}>Transactions</button>
        </div>

        {/* spacer between groups for noticeable horizontal distance */}
        <div className="mx-6" />

        {/* Management related tabs grouped together */}
        <div className="flex items-center gap-2">
          <button className={`px-3 py-1 rounded ${tab==='manageCycles'? 'bg-indigo-600 text-white':'bg-gray-200'}`} onClick={()=>changeTab('manageCycles')}>Manage Cycles</button>
          <button className={`px-3 py-1 rounded ${tab==='locations'? 'bg-indigo-600 text-white':'bg-gray-200'}`} onClick={()=>changeTab('locations')}>Manage Locations</button>
        </div>
      </div>

      <div className="mb-3 space-x-2">
        {tab === 'users' && (
          <>
            <input value={userFilter} onChange={e=>setUserFilter(e.target.value)} placeholder="User id or username" className="border p-1" />
            <button onClick={load} className="ml-2 bg-green-600 text-white px-2 py-1">Search</button>
          </>
        )}

        {tab === 'cycles' && (
          <>
            <input value={cycleFilter} onChange={e=>setCycleFilter(e.target.value)} placeholder="Cycle id" className="border p-1" />
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="border p-1">
              <option value="">Any status</option>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <select value={locationFilter} onChange={e=>setLocationFilter(e.target.value)} className="border p-1">
              <option value="">All locations</option>
              {locations.map(l => <option key={l._id} value={l.name}>{l.name}</option>)}
            </select>
            <button onClick={load} className="ml-2 bg-green-600 text-white px-2 py-1">Apply</button>

            {/* Manage cycles moved to separate page */}
          </>
        )}

        {tab === 'bookings' && (
          <>
            <input value={bookingFilter} onChange={e=>setBookingFilter(e.target.value)} placeholder="Booking id" className="border p-1" />
            <input value={cycleFilter} onChange={e=>setCycleFilter(e.target.value)} placeholder="Cycle id" className="border p-1" />
            <input value={userFilter} onChange={e=>setUserFilter(e.target.value)} placeholder="User id" className="border p-1" />
            <select value={locationFilter} onChange={e=>setLocationFilter(e.target.value)} className="border p-1">
              <option value="">End Location (all)</option>
              {locations.map(l => <option key={l._id} value={l.name}>{l.name}</option>)}
            </select>
            <label className="ml-2"><input type="checkbox" checked={activeOnly} onChange={e=>setActiveOnly(e.target.checked)} /> Active only</label>
            <button onClick={load} className="ml-2 bg-green-600 text-white px-2 py-1">Apply</button>
          </>
        )}

        {tab === 'manageCycles' && (
          <AdminCycles />
        )}

        {tab === 'locations' && (
          <AdminLocations />
        )}

        {/* users tab uses the search input above; management moved to separate page */}

        {tab === 'transactions' && (
          <>
            <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Transaction id / user id" className="border p-1" />
            <button onClick={load} className="ml-2 bg-green-600 text-white px-2 py-1">Search</button>
          </>
        )}
      </div>

      <div className="bg-white p-4 rounded shadow">
        {loading ? <div>Loading...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.length===0 && <div className="text-gray-600">No items found</div>}
            {items.map((it, idx) => (
              <div key={it._id || idx} className="border rounded p-3">
                {tab === 'users' && (
                  <>
                    <div className="font-semibold">{it.fullName || it.userName || it.email}</div>
                    <div className="text-sm">Username: {it.userName}</div>
                    <div className="text-sm">Email: {it.email}</div>
                    <div className="text-sm">Has penalty: {String(it.hasPenalty)}</div>
                    <div className="text-sm">Penalty Amount: {it.penaltyAmount || 0}</div>
                    <div className="mt-2">
                      {it.hasPenalty && (<button onClick={()=>handleAdminPayPenalty(it._id)} className="bg-yellow-500 text-white px-3 py-1 rounded">Settle Penalty</button>)}
                    </div>
                  </>
                )}

                {tab === 'cycles' && (
                  <>
                    <div className="font-semibold">Cycle #{it.cycleNumber || it._id}</div>
                    <div className="text-sm">Model: {it.model}</div>
                    <div className="text-sm">Status: {it.status}</div>
                    <div className="text-sm">Current location: {it.currentLocation?.coordinates ? `${it.currentLocation.coordinates[1].toFixed(5)}, ${it.currentLocation.coordinates[0].toFixed(5)}` : 'N/A'}</div>
                  </>
                )}

                {(tab === 'bookings' || tab === 'returned') && (
                  <>
                    <div className="font-semibold">Booking #{it._id}</div>
                    <div className="text-sm">User: {it.userId || (it.user && it.user.userName)}</div>
                    <div className="text-sm">Cycle: {it.cycleId || (it.cycle && it.cycle.cycleNumber)}</div>
                    <div className="text-sm">Status: {it.status}</div>
                    <div className="text-sm">Start: {it.startTime ? new Date(it.startTime).toLocaleString() : 'N/A'}</div>
                    <div className="text-sm">End: {it.actualEndTime ? new Date(it.actualEndTime).toLocaleString() : (it.estimatedEndTime ? new Date(it.estimatedEndTime).toLocaleString() : 'N/A')}</div>
                  </>
                )}

                {tab === 'transactions' && (
                  <>
                    <div className="font-semibold">Transaction #{it._id}</div>
                    <div className="text-sm">User: {it.userId}</div>
                    <div className="text-sm">Amount: {formatRupees(it.amount)}</div>
                    <div className="text-sm">Status: {it.status}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
