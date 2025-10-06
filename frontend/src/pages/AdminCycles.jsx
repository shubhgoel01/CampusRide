import React, { useEffect, useState } from 'react'
import api, { getCycles, getLocations, addCycle, deleteCycle } from '../api'

export default function AdminCycles(){
  const [cycles, setCycles] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [status, setStatus] = useState('available')
  const [location, setLocation] = useState('')

  useEffect(()=>{ loadLocations(); loadCycles() }, [])

  const loadLocations = async ()=>{
    try{
      const res = await getLocations()
      setLocations(res?.data?.data || [])
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
    if(!confirm('Delete cycle?')) return
    try{
      await deleteCycle(cId)
      alert('Cycle deleted')
      loadCycles()
    }catch(e){ alert(e?.response?.data?.message || 'Failed to delete cycle') }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Manage Cycles</h3>
      <div className="mb-3 p-3 border rounded">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Cycle name" className="border p-1 mr-2" />
        <select value={status} onChange={e=>setStatus(e.target.value)} className="border p-1 mr-2">
          <option value="available">Available</option>
          <option value="booked">Booked</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select value={location} onChange={e=>setLocation(e.target.value)} className="border p-1 mr-2">
          <option value="">Assign location (optional)</option>
          {locations.map(l => <option key={l._id} value={l.name}>{l.name}</option>)}
        </select>
        <button onClick={handleAdd} className="bg-blue-600 text-white px-2 py-1">Add Cycle</button>
      </div>

      <div>
        {loading ? <div>Loading...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cycles.length===0 && <div className="text-gray-600">No cycles found</div>}
            {cycles.map(c => (
              <div key={c._id} className="border p-3 rounded">
                <div className="font-semibold">{c.cycleName || c._id}</div>
                <div className="text-sm">Status: {c.status}</div>
                <div className="mt-2">
                  <button onClick={()=>handleDelete(c._id)} className="bg-red-600 text-white px-2 py-1">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
