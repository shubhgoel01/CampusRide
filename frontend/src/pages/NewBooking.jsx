import React, {useEffect, useState} from 'react'
import { getCycles, getAvailableCycles, createBooking, getActiveBookings, getReturnedBookings } from '../api'

export default function NewBooking(){
  const [user, setUser] = useState(null)
  // current placeholder locations (fixed per request)
  const [locations, setLocations] = useState(['Food Court', 'Main Building']) // placeholder; ideally fetched from backend or admin
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [isRoundTrip, setIsRoundTrip] = useState(false)
  const [cycle, setCycle] = useState(null)
  const [error, setError] = useState('')
  const [foundMessage, setFoundMessage] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [activeBooking, setActiveBooking] = useState(null)
  const [returnedBooking, setReturnedBooking] = useState(null)

  useEffect(()=>{
    // try to load current user and existing bookings (active/returned)
    const cached = sessionStorage.getItem('user')
    if(cached){
      try{ setUser(JSON.parse(cached)) }catch(e){}
    }

    const onUserChanged = ()=>{
      const c = sessionStorage.getItem('user')
      if(c){ try{ setUser(JSON.parse(c)) }catch(e){ setUser(null) } }
      else setUser(null)
    }
    window.addEventListener('userChanged', onUserChanged)

    // load active / returned bookings for this user (if present)
    const loadBookings = async ()=>{
      try{
        const c = sessionStorage.getItem('user')
        if(!c) return
        const u = JSON.parse(c)
        try{
          const act = await getActiveBookings({ userId: u._id })
          if(act?.data?.statusCode === 200 || act?.data?.success){
            if(act.data.data && act.data.data.length>0) setActiveBooking(act.data.data[0])
          }
        }catch(e){}

        try{
          const ret = await getReturnedBookings({ userId: u._id })
          if(ret?.data?.statusCode === 200 || ret?.data?.success){
            if(ret.data.data && ret.data.data.length>0) setReturnedBooking(ret.data.data[0])
          }
        }catch(e){}
      }catch(e){}
    }
    loadBookings()

    // could fetch locations from backend if endpoint exists; using placeholder for now
    return ()=> window.removeEventListener('userChanged', onUserChanged)
  },[])

  const handleFindCycle = async ()=>{
    setError('')
    setFoundMessage('')
    setCycle(null)
    setActiveBooking(null)
    if(returnedBooking){ setError('You have a returned booking awaiting verification. Cannot find or create new booking.'); return }
    if(!start || !end){ setError('Select start and end'); return }
    if(start === end){ setError('Start and end cannot be the same'); return }
    setIsSearching(true)
    try{
      // backend expects geoCoding via body.location array; but getAvailableCycles uses GET with query => use location query param
      const lcStart = String(start).trim().toLowerCase()
      const res = await getAvailableCycles({ location: lcStart })

      if(res?.data?.statusCode === 200 || res?.data?.success){
        const found = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data
        if(found){
          setCycle(found)
          setFoundMessage('Cycle available, book fast')
        }
      }
    }
    catch(err){
      // not found: show friendly message and optionally show current booking if any
      const msg = err?.response?.data?.message || 'No cycles available'
      setError(msg)
    }
    finally{ setIsSearching(false) }
  }

  const handleCreate = async ()=>{
    setError('')
    setFoundMessage('')
    if(returnedBooking){ setError('You have a returned booking awaiting verification. Cannot create a new booking.'); return }
    setIsCreating(true)
    try{
      // re-check availability to avoid race conditions
      const lcStart = String(start).trim().toLowerCase()
      const avail = await getAvailableCycles({ location: lcStart })

      if(!(avail?.data?.statusCode === 200 || avail?.data?.success)){
        // no cycle now available -> show active booking state
        setError('No cycles available right now. Showing active booking if any.')
        try{
          const act = await getActiveBookings({ userId: user?._id })
          if(act?.data?.statusCode === 200 || act?.data?.success){
            if(act.data.data && act.data.data.length>0) setActiveBooking(act.data.data[0])
          }
        }catch(e){}
        return
      }

      const cycleToBook = Array.isArray(avail.data.data) ? avail.data.data[0] : avail.data.data
      if(!cycleToBook){
        setError('No cycles available')
        return
      }

      const payload = {
        cycleId: cycleToBook._id,
        isRoundTrip,
        location: [String(start).trim().toLowerCase(), String(end).trim().toLowerCase()]
      }

      const res = await createBooking(payload)
      if(res?.data?.statusCode===201 || res?.data?.success){
        alert('Booking created')
        window.location.href = '/home'
      }
    }
    catch(err){
      const msg = err?.response?.data?.message || 'Failed to create booking'
      setError(msg)
      // if failed due to already booked, try to show active booking
      try{
        const act = await getActiveBookings({ userId: user?._id })
        if(act?.data?.statusCode === 200 || act?.data?.success){
          if(act.data.data && act.data.data.length>0) setActiveBooking(act.data.data[0])
        }
        // also check returned bookings (awaiting guard verification)
        const ret = await getReturnedBookings({ userId: user?._id })
        if(ret?.data?.statusCode === 200 || ret?.data?.success){
          if(ret.data.data && ret.data.data.length>0){
            // show the most recent returned booking for this user
            setReturnedBooking(ret.data.data[0])
          }
        }
      }catch(e){}
    }
    finally{ setIsCreating(false) }
  }

  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Create Booking</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}

      <label className="block">
        <span className="text-sm text-gray-600">Start Location</span>
        <select value={start} onChange={e=>setStart(e.target.value)} className="w-full border px-2 py-1 rounded mt-1">
          <option value="">Select start</option>
          {locations.map(l=> <option key={l} value={l}>{l}</option>)}
        </select>
      </label>

      <label className="block mt-2">
        <span className="text-sm text-gray-600">End Location</span>
        <select value={end} onChange={e=>setEnd(e.target.value)} className="w-full border px-2 py-1 rounded mt-1">
          <option value="">Select end</option>
          {locations.map(l=> <option key={l} value={l}>{l}</option>)}
        </select>
      </label>

      <label className="block mt-3">
        <input type="checkbox" checked={isRoundTrip} onChange={e=>setIsRoundTrip(e.target.checked)} /> <span className="ml-2">Round trip</span>
      </label>

      <div className="mt-4 flex space-x-2">
        <button disabled={isSearching} onClick={handleFindCycle} className="bg-indigo-600 text-white px-3 py-1 rounded disabled:opacity-50">{isSearching ? 'Searching...' : 'Find Cycle'}</button>
        <button disabled={!cycle || isCreating} onClick={handleCreate} className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50">{isCreating ? 'Creating...' : 'Create Booking'}</button>
      </div>

      {foundMessage && <div className="mt-3 text-green-700">{foundMessage}</div>}

      {cycle && (
        <div className="mt-4 p-3 border rounded">
          <div><strong>Cycle:</strong> {cycle.cycleName || cycle.cycleNumber || cycle._id}</div>
          <div><strong>Status:</strong> {cycle.status}</div>
        </div>
      )}

      {activeBooking && (
        <div className="mt-4 p-3 border rounded bg-yellow-50">
          <div className="font-semibold">Booking in progress</div>
          <div>Start: {String(activeBooking.startTime)}</div>
          <div>Estimated end: {String(activeBooking.estimatedEndTime)}</div>
          <div>
            Time remaining: {(() => {
              try{
                const end = new Date(activeBooking.estimatedEndTime).getTime()
                const now = Date.now()
                const ms = Math.max(0, end - now)
                const mins = Math.floor(ms/60000)
                const secs = Math.floor((ms%60000)/1000)
                return `${mins}m ${secs}s`
              }catch(e){ return 'N/A' }
            })()}
          </div>
        </div>
      )}
      {returnedBooking && (
        <div className="mt-4 p-3 border rounded bg-yellow-50">
          <div className="font-semibold">Booking returned — awaiting verification</div>
          <div>Status: {returnedBooking.status}</div>
          <div>Penalty Amount: {returnedBooking.penaltyAmount || 0}</div>
          <div>Start: {String(returnedBooking.startTime)}</div>
          <div>Returned At: {String(returnedBooking.actualEndTime)}</div>
          <div className="mt-2 text-sm text-yellow-700">You cannot create a new booking while one booking is awaiting guard verification.</div>
        </div>
      )}
    </div>
  )
}
