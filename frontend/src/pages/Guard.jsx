import React, { useEffect, useState } from 'react'
import api, { getReturnedBookings } from '../api'
import { ensureLocationsLoaded, formatLocation } from '../utils/locationCache'

export default function Guard() {
  const [items, setItems] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterLocation, setFilterLocation] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadLocations()
    loadBookings()
  }, [])

  const loadLocations = async () => {
    try {
      const list = await ensureLocationsLoaded()
      setLocations(list || [])
    } catch (e) { console.error('Failed to load locations', e) }
  }

  const loadBookings = async () => {
    setLoading(true)
    try {
      // In a real app we might pass filters to backend, here we fetch all and client-filter if needed
      // or pass basics if supported
      const res = await getReturnedBookings({})
      setItems(res?.data?.data || [])
    } catch (e) { console.error('Failed to load bookings', e) }
    finally { setLoading(false) }
  }

  const handleMarkReceived = async (bookingId) => {
    if (!confirm('Confirm: Mark this cycle as physically received/verified?')) return
    try {
      const res = await api.patch(`/guard/mark-received/${bookingId}`)
      if (res?.data?.statusCode === 200 || res?.data?.success) {
        // alert('Marked received') // Success message adds friction, just reload
        loadBookings()
      }
    } catch (e) { alert(e?.response?.data?.message || 'Failed to action') }
  }

  // Client-side filtering for search responsiveness
  const filteredItems = items.filter(i => {
    if (filterLocation) {
      const endName = i.endLocationName || formatLocation(i.endLocation)
      // simple heuristic matching
      if (!endName.toLowerCase().includes(filterLocation.toLowerCase()) &&
        !String(i.endLocation?.coordinates).includes(filterLocation)) return false
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const user = i.user?.fullName || i.user?.userName || ''
      const cycle = i.cycle?.cycleName || i.cycle?.cycleNumber || ''
      return user.toLowerCase().includes(q) || cycle.toLowerCase().includes(q) || i._id.includes(q)
    }
    return true
  })

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Station Guard Dashboard</h1>
          <p className="text-slate-500 mt-1">Verify returned cycles and manage station inventory.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadBookings} className="p-2 text-slate-500 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors" title="Refresh">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            type="text"
            placeholder="Search by User, Cycle ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 w-full bg-white border border-slate-200 rounded-xl py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
        <div className="sm:w-64">
          <select
            value={filterLocation}
            onChange={e => setFilterLocation(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
          >
            <option value="">All Locations</option>
            {locations.map(l => <option key={l._id} value={l.name}>{l.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700">Returns Pending Verification</h3>
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">{filteredItems.length} Pending</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Cycle</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Return Location</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Penalty</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400">Loading pending returns...</td></tr>
              )}
              {!loading && filteredItems.length === 0 && (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400">No bookings waiting for verification.</td></tr>
              )}
              {!loading && filteredItems.map(r => {
                const diff = new Date(r.actualEndTime).getTime() - new Date(r.startTime).getTime()
                const mins = Math.max(0, Math.floor(diff / 60000))
                const durationStr = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`

                return (
                  <tr key={r._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-slate-700">{r.cycle?.cycleName || r.cycle?.cycleNumber || r.cycleId?.slice(0, 8)}</div>
                      <div className="text-[10px] text-slate-400">{new Date(r.actualEndTime).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {r.user?.fullName || r.user?.userName || r.userId}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {r.endLocationName || formatLocation(r.endLocation)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{durationStr}</td>
                    <td className="px-6 py-4">
                      {r.penaltyAmount > 0 ? (
                        <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded-md text-xs">₹{(r.penaltyAmount / 100).toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-300">₹0.00</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleMarkReceived(r._id)}
                        className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all transform active:scale-95"
                      >
                        Verify & Accept
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
