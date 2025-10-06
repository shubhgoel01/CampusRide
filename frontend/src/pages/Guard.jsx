import React, { useEffect, useState } from 'react'
import api, { getReturnedBookings, getLocations } from '../api'

export default function Guard(){
  const [tab, setTab] = useState('returned')
  const [filter, setFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [locations, setLocations] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(()=>{ load(); loadLocations() }, [tab])

  const loadLocations = async ()=>{
    try{
      const res = await getLocations()
      setLocations(res?.data?.data || [])
    }catch(e){ console.error(e) }
  }

  const load = async ()=>{
    setLoading(true)
    try{
      if(tab === 'returned'){
        const params = {}
        if(userFilter) params.userId = userFilter
        if(locationFilter) params.location = locationFilter
        const res = await getReturnedBookings(Object.keys(params).length ? params : {})
        setItems(res?.data?.data || [])
      }
    }catch(e){ console.error(e) }
    finally{ setLoading(false) }
  }

  const markReceived = async (bookingId)=>{
    try{
      const res = await api.patch(`/guard/mark-received/${bookingId}`)
      if(res?.data?.statusCode===200 || res?.data?.success){
        alert('Marked received')
        load()
      }
    }catch(e){ alert('Failed to mark received') }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Guard Dashboard</h2>
      <div className="mb-3">
        <button className={`px-3 py-1 mr-2 ${tab==='returned'? 'bg-indigo-600 text-white':'bg-gray-200'}`} onClick={()=>setTab('returned')}>Returned Bookings</button>
      </div>

      <div className="mb-3 space-x-2">
        <input value={userFilter} onChange={e=>setUserFilter(e.target.value)} placeholder="Filter by userId" className="border p-1" />
        <select value={locationFilter} onChange={e=>setLocationFilter(e.target.value)} className="border p-1">
          <option value="">All locations</option>
          {locations.map(l => <option key={l._id} value={l.name}>{l.name}</option>)}
        </select>
        <button onClick={load} className="ml-2 bg-green-600 text-white px-2 py-1">Apply</button>
      </div>

      <div className="bg-white p-4 rounded shadow">
        {loading ? <div>Loading...</div> : (
          <div>
            {items.length===0 && <div>No returned bookings</div>}
            {items.map(it => (
              <div key={it._id} className="border-b py-2">
                <div><strong>User:</strong> {it.user?.userName} ({it.user?.fullName})</div>
                <div><strong>Cycle:</strong> {it.cycle?.cycleNumber} - {it.cycle?.model}</div>
                <div><strong>Returned at:</strong> {it.actualEndTime ? new Date(it.actualEndTime).toLocaleString() : 'N/A'}</div>
                <div className="mt-2">
                  <button onClick={()=>markReceived(it._id)} className="bg-blue-600 text-white px-2 py-1 rounded">Mark Received</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
