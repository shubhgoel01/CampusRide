import React, { useEffect, useState } from 'react'
import api, { getReturnedBookings } from '../api'
import { ensureLocationsLoaded } from '../utils/locationCache'

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
      const list = await ensureLocationsLoaded()
      setLocations(list || [])
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
            {items.length===0 && <div className="text-gray-500">No returned bookings</div>}
            {items.length>0 && (
              <div className="w-full overflow-x-auto hide-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-sm text-slate-600">
                      <th className="px-3 py-2">Cycle</th>
                      <th className="px-3 py-2">User</th>
                      <th className="px-3 py-2">Returned Time</th>
                      <th className="px-3 py-2">Duration</th>
                      <th className="px-3 py-2">Penalty</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(r => {
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
                        <tr key={r._id} className={`hover:bg-gray-50 ${r.penaltyAmount && r.penaltyAmount>0 ? 'bg-red-50/30' : ''}`}>
                          <td className="px-3 py-2 text-sm">{cycleName}</td>
                          <td className="px-3 py-2 text-sm">{userName}</td>
                          <td className="px-3 py-2 text-sm">{returnedAt}</td>
                          <td className="px-3 py-2 text-sm">{duration}</td>
                          <td className="px-3 py-2 text-sm">₹{r.penaltyAmount || 0}</td>
                          <td className="px-3 py-2 text-sm">
                            <button onClick={async ()=>{
                              if(!confirm('Mark this return as verified?')) return
                              try{
                                await markReceived(r._id)
                              }catch(e){ /* markReceived already alerts */ }
                            }} className="px-2 py-1 bg-sky-600 text-white rounded text-xs">Mark Received</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
