import React, { useEffect, useState } from 'react'
import api, { getCycles, addCycle, deleteCycle } from '../api'
import { ensureLocationsLoaded } from '../utils/locationCache'

export default function AdminCycles() {
  const [cycles, setCycles] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [status, setStatus] = useState('available')
  const [location, setLocation] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { loadLocations(); loadCycles() }, [])

  const loadLocations = async () => {
    try {
      const list = await ensureLocationsLoaded()
      setLocations(list || [])
    } catch (e) { console.error(e); setLocations([]) }
  }

  const loadCycles = async () => {
    setLoading(true)
    try {
      const res = await getCycles()
      setCycles(res?.data?.data || [])
    } catch (e) { console.error(e); setCycles([]) }
    finally { setLoading(false) }
  }

  const handleAdd = async () => {
    if (!name) return alert('Please provide cycle name')
    try {
      const payload = { cycleName: name, status }
      if (location) payload.location = location
      await addCycle(payload)
      alert('Cycle added')
      setName(''); setStatus('available'); setLocation('')
      loadCycles()
    } catch (e) { alert(e?.response?.data?.message || 'Failed to add cycle') }
  }

  const handleDelete = async (cId) => {
    if (!cId) return
    if (!confirm('Delete cycle? This action cannot be undone.')) return
    try {
      await deleteCycle(cId)
      alert('Cycle deleted')
      loadCycles()
    } catch (e) { alert(e?.response?.data?.message || 'Failed to delete cycle') }
  }

  const statusLabel = (s) => {
    if (!s) return 'Unknown'
    if (s === 'available') return 'Available'
    if (s === 'booked' || s === 'in-use' || s === 'in use') return 'In Use'
    if (s === 'maintenance') return 'Maintenance'
    return s
  }

  const statusColor = (s) => {
    if (s === 'available') return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
    if (s === 'booked' || s === 'in-use' || s === 'in use') return 'bg-yellow-100 text-yellow-700 border border-yellow-200'
    if (s === 'maintenance') return 'bg-red-100 text-red-700 border border-red-200'
    return 'bg-slate-100 text-slate-600 border border-slate-200'
  }

  const filtered = cycles.filter(c => {
    const q = search.trim().toLowerCase()
    if (statusFilter !== 'all') {
      const mapStatus = statusFilter === 'available' ? 'available' : statusFilter === 'in-use' ? 'booked' : statusFilter
      if ((c.status || '').toLowerCase() !== String(mapStatus).toLowerCase()) return false
    }
    if (!q) return true
    return (c.cycleName || '').toLowerCase().includes(q) || (c.location || '').toLowerCase().includes(q)
  })

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-800">Manage Cycles</h3>
        <button onClick={loadCycles} className="text-sm text-primary hover:underline">Refresh</button>
      </div>

      {/* Add Cycle Panel */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
        <h4 className="text-sm font-semibold text-slate-700 uppercase mb-4">Add New Cycle</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Cycle Name/Number</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. CYC-001" className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm">
              <option value="available">Available</option>
              <option value="booked">In Use</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Location</label>
            <select value={location} onChange={e => setLocation(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm">
              <option value="">Select location...</option>
              {locations.map(l => <option key={l._id} value={l.name}>{l.name}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleAdd} className="px-5 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors text-sm shadow-sm transition-transform active:scale-95">
            + Add Cycle
          </button>
        </div>
      </div>

      <hr className="border-slate-100 my-6" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-auto flex rounded-lg bg-slate-100 p-1">
          <button onClick={() => setStatusFilter('all')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All</button>
          <button onClick={() => setStatusFilter('available')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === 'available' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Available</button>
          <button onClick={() => setStatusFilter('in-use')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === 'in-use' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>In Use</button>
          <button onClick={() => setStatusFilter('maintenance')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === 'maintenance' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Maintenance</button>
        </div>
        <div className="w-full sm:w-64">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cycles..." className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
        </div>
      </div>

      {/* Cycle Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading && <div className="col-span-full py-8 text-center text-slate-400">Loading cycles...</div>}
        {!loading && filtered.length === 0 && <div className="col-span-full py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">No cycles found matching criteria.</div>}

        {!loading && filtered.map(c => (
          <div key={c._id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow relative group">
            <div className="flex justify-between items-start mb-2">
              <div className="font-bold text-slate-800">{c.cycleName || String(c._id).slice(0, 8)}</div>
              <button onClick={() => handleDelete(c._id)} className="text-slate-300 hover:text-red-500 transition-colors p-1" title="Delete Cycle">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${statusColor(c.status)}`}>{statusLabel(c.status)}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="truncate">{c.location || 'Unknown Location'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
