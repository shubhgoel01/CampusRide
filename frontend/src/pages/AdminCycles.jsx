import React, { useEffect, useState } from 'react'
import api, { getCycles, addCycle, deleteCycle } from '../api'
import { ensureLocationsLoaded } from '../utils/locationCache'

export default function AdminCycles(){
  const [cycles, setCycles] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [status, setStatus] = useState('available')
  const [location, setLocation] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(()=>{ loadLocations(); loadCycles() }, [])

  const loadLocations = async ()=>{
    try{
      const list = await ensureLocationsLoaded()
      setLocations(list || [])
    }catch(e){ console.error(e); setLocations([]) }
  }

  const loadCycles = async ()=>{
    setLoading(true)
    try{
      const res = await getCycles()
      setCycles(res?.data?.data || [])
    }catch(e){ console.error(e); setCycles([]) }
    finally{ setLoading(false) }
  }

  const handleAdd = async ()=>{
    if(!name) return alert('Please provide cycle name')
    try{
      const payload = { cycleName: name, status }
      if(location) payload.location = location
      await addCycle(payload)
      alert('Cycle added')
      setName(''); setStatus('available'); setLocation('')
      loadCycles()
    }catch(e){ alert(e?.response?.data?.message || 'Failed to add cycle') }
  }

  const handleDelete = async (cId)=>{
    if(!cId) return
    if(!confirm('Delete cycle? This action cannot be undone.')) return
    try{
      await deleteCycle(cId)
      alert('Cycle deleted')
      loadCycles()
    }catch(e){ alert(e?.response?.data?.message || 'Failed to delete cycle') }
  }

  const statusLabel = (s) => {
    if(!s) return 'Unknown'
    if(s === 'available') return 'Available'
    if(s === 'booked' || s === 'in-use' || s === 'in use') return 'In Use'
    if(s === 'maintenance') return 'Maintenance'
    return s
  }

  const statusColor = (s) => {
    if(s === 'available') return 'bg-emerald-500 text-white'
    if(s === 'booked' || s === 'in-use' || s === 'in use') return 'bg-yellow-400 text-black'
    if(s === 'maintenance') return 'bg-red-600 text-white'
    return 'bg-gray-400 text-white'
  }

  const filtered = cycles.filter(c => {
    const q = search.trim().toLowerCase()
    if(statusFilter !== 'all'){
      const mapStatus = statusFilter === 'available' ? 'available' : statusFilter === 'in-use' ? 'booked' : statusFilter
      if((c.status || '').toLowerCase() !== String(mapStatus).toLowerCase()) return false
    }
    if(!q) return true
    return (c.cycleName || '').toLowerCase().includes(q) || (c.location || '').toLowerCase().includes(q)
  })

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <h3 className="text-2xl font-semibold mb-4">Manage Cycles</h3>

      {/* Add Cycle Panel */}
      <div className="w-full flex justify-center">
        <div className="w-full md:w-11/12 lg:w-10/12 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-sm text-gray-300">Cycle Name</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter cycle name" className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm" />
            </div>

            <div>
              <label className="text-sm text-gray-300">Status</label>
              <select value={status} onChange={e=>setStatus(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm">
                <option value="available">Available</option>
                <option value="booked">In Use</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-300">Location</label>
              <select value={location} onChange={e=>setLocation(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm">
                <option value="">Assign location (optional)</option>
                {locations.map(l => <option key={l._id} value={l.name}>{l.name}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button onClick={handleAdd} className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-purple-600 hover:to-blue-600 text-white transition-transform transform hover:-translate-y-0.5">Add Cycle</button>
          </div>
        </div>
      </div>

  <hr className="border-white/10 my-6" />

      {/* Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or location" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <div className="flex rounded-md bg-white/5 p-1">
            <button onClick={()=>setStatusFilter('all')} className={`px-3 py-1 text-sm ${statusFilter==='all' ? 'bg-white/10 font-medium' : ''}`}>All</button>
            <button onClick={()=>setStatusFilter('available')} className={`px-3 py-1 text-sm ${statusFilter==='available' ? 'bg-white/10 font-medium' : ''}`}>Available</button>
            <button onClick={()=>setStatusFilter('in-use')} className={`px-3 py-1 text-sm ${statusFilter==='in-use' ? 'bg-white/10 font-medium' : ''}`}>In Use</button>
            <button onClick={()=>setStatusFilter('maintenance')} className={`px-3 py-1 text-sm ${statusFilter==='maintenance' ? 'bg-white/10 font-medium' : ''}`}>Maintenance</button>
          </div>
        </div>
      </div>

      {/* Cycle Grid (scrollable) */}
  <div className="flex-1 overflow-auto hide-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading && <div className="text-gray-400">Loading cycles...</div>}
          {!loading && filtered.length===0 && <div className="text-gray-400">No cycles found</div>}

          {!loading && filtered.map(c => (
            <div key={c._id} className="bg-white/6 rounded-2xl p-3 pb-6 shadow-md transform hover:shadow-lg hover:-translate-y-1 transition-transform duration-150 relative cursor-default">
              <div className="mb-2">
                <div className="text-lg font-semibold">{c.cycleName || String(c._id).slice(0,8)}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs ${statusColor(c.status)}`}>{statusLabel(c.status)}</span>
                  <div className="text-sm text-gray-300">{c.location || '—'}</div>
                </div>
              </div>

              <div className="mt-4">
                <button onClick={()=>handleDelete(c._id)} className="px-3 py-1 bg-red-600 text-white rounded">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
