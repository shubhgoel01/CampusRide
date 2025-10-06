import React, { useEffect, useState } from 'react'
import { getUser, getActiveBookings, settlePenalty, endBooking, cancelBooking, getReturnedBookings } from '../api'
import api from '../api'
import StripePaymentWrapper from '../components/StripePayment'
import { useNavigate } from 'react-router-dom'

export default function Home(){
  const [user, setUser] = useState(null)
  const [activeBookings, setActiveBookings] = useState([])
  const [returnedBookings, setReturnedBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPaymentBookingId, setShowPaymentBookingId] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const navigate = useNavigate()

  useEffect(()=>{
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

    const load = async ()=>{
      try{
        const userRes = await getUser()
        const currentUser = (userRes?.data?.statusCode===200 || userRes?.data?.success) ? (Array.isArray(userRes.data.data)? userRes.data.data[0] : userRes.data.data) : null
        if(currentUser) {
          setUser(currentUser)
          sessionStorage.setItem('user', JSON.stringify(currentUser))
        }

  // load active bookings (filter by fetched currentUser if available)
  const activeRes = await getActiveBookings(currentUser ? { userId: currentUser._id } : {})
        if(activeRes?.data?.statusCode===200 || activeRes?.data?.success) {
          const items = activeRes.data.data || []
          // enrich with start/end names
          const enriched = await Promise.all(items.map(async (b)=>{
            const copy = {...b}
            try{
              const sc = b.startLocation?.coordinates
              const ec = b.endLocation?.coordinates
              if(sc){ const s = await api.post('/location/lookup', { coordinates: sc }); copy.startName = s?.data?.data?.name || null }
              if(ec){ const e2 = await api.post('/location/lookup', { coordinates: ec }); copy.endName = e2?.data?.data?.name || null }
            }catch(e){}
            return copy
          }))
          setActiveBookings(enriched)
        }

        // load returned bookings for current user
        if(currentUser){
          try{
            const returnedRes = await getReturnedBookings({ userId: currentUser._id })
            if(returnedRes?.data?.statusCode===200 || returnedRes?.data?.success){
              const items = returnedRes.data.data || []
              const enrichedR = await Promise.all(items.map(async (last)=>{
                const copy = {...last}
                try{
                  const sc = last.startLocation?.coordinates
                  const ec = last.endLocation?.coordinates
                  if(sc){ const s = await api.post('/location/lookup', { coordinates: sc }); copy.startName = s?.data?.data?.name || null }
                  if(ec){ const e2 = await api.post('/location/lookup', { coordinates: ec }); copy.endName = e2?.data?.data?.name || null }
                }catch(e){}
                return copy
              }))
              setReturnedBookings(enrichedR)
            }
          }catch(e){}
        }
      }
      catch(err){
        setError(err?.response?.data?.message || 'Failed to load')
      }
      finally{setLoading(false)}
    }
    load()
    return ()=> window.removeEventListener('userChanged', onUserChanged)
  },[])

  const handlePayPenalty = async ()=>{
    if(!user) return
    // prefer Stripe payment using the returned booking that contains the penalty
    const returnedWithPenalty = returnedBookings && returnedBookings.find(b=> b.penaltyAmount && b.penaltyAmount>0)
    if(returnedWithPenalty){
      setShowPaymentBookingId(returnedWithPenalty._id)
      setPaymentAmount(returnedWithPenalty.penaltyAmount)
      return
    }

    // fallback: ask for amount and call settlePenalty (admin style / non-Stripe)
    const amount = prompt('Enter amount to pay')
    if(!amount) return
    try{
      const res = await settlePenalty(user._id, { amountPaid: Number(amount) })
      if(res?.data?.statusCode===200 || res?.data?.success) {
        setUser(res.data.data)
        sessionStorage.setItem('user', JSON.stringify(res.data.data))
      }
      alert('Penalty updated')
    }
    catch(err){ alert(err?.response?.data?.message || 'Payment failed') }
  }

  const handleEndBooking = async ()=>{
    if(!activeBookings || activeBookings.length===0) return
    // If user has multiple active bookings, close the first one for simplicity (UI triggers should pass id instead)
    const bid = activeBookings[0]._id
    try{
      const res = await endBooking(bid)
      if(res?.data?.statusCode===200 || res?.data?.success){
        alert('Booking ended – waiting for guard verification')
        // refresh lists
        // reload data by re-running load effect: simplest is to call load logic again
  // we'll call getActiveBookings and getReturnedBookings quickly here
  const aRes = await getActiveBookings(user ? { userId: user._id } : {}); setActiveBookings(aRes?.data?.data || [])
        if(user){ const rRes = await getReturnedBookings({ userId: user._id }); setReturnedBookings(rRes?.data?.data || []) }
      }
    }
    catch(err){ alert(err?.response?.data?.message || 'Failed to end booking') }
  }

  const handleEndBookingById = async (bookingId)=>{
    try{
      const res = await endBooking(bookingId)
      if(res?.data?.statusCode===200 || res?.data?.success){
        alert('Booking ended – waiting for guard verification')
  const aRes = await getActiveBookings(user ? { userId: user._id } : {}); setActiveBookings(aRes?.data?.data || [])
        if(user){ const rRes = await getReturnedBookings({ userId: user._id }); setReturnedBookings(rRes?.data?.data || []) }
      }
    }catch(err){ alert(err?.response?.data?.message || 'Failed to end booking') }
  }

  const handleCancelBooking = async (bookingId)=>{
    if(!bookingId) return
    try{
      const res = await cancelBooking(bookingId)
      if(res?.data?.statusCode===200 || res?.data?.success){
        alert('Booking cancelled')
  const aRes = await getActiveBookings(user ? { userId: user._id } : {}); setActiveBookings(aRes?.data?.data || [])
      }
    }catch(err){ alert(err?.response?.data?.message || 'Failed to cancel booking') }
  }

  if(loading) return <div>Loading...</div>

  return (
    <div>
      {error && <div className="text-red-600">{error}</div>}
      <div className="bg-white p-4 rounded shadow mb-4">
        <h3 className="text-lg font-semibold">User Profile</h3>
        {user ? (
          <div className="mt-2">
            <div><strong>Name:</strong> {user.fullName}</div>
            <div><strong>Username:</strong> {user.userName}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Has penalty:</strong> {String(user.hasPenalty)}</div>
            <div><strong>Penalty Amount:</strong> {user.penaltyAmount || 0}</div>
            <div className="mt-2">
              {user.hasPenalty && <button onClick={handlePayPenalty} className="bg-yellow-500 text-white px-3 py-1 rounded">Pay Penalty</button>}
            </div>
          </div>
        ):(<div>No user data</div>)}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold">Active Bookings</h3>
          {activeBookings && activeBookings.length>0 ? (
            <div className="space-y-3 mt-2">
              {activeBookings.map(b=> (
                <div key={b._id} className="p-3 border rounded">
                  <div className="font-semibold">Booking #{b._id}</div>
                  <div className="mt-1"><strong>Status:</strong> {b.status}</div>
                  <div className="mt-1"><strong>Start:</strong> {b.startName || (b.startLocation && b.startLocation.coordinates ? `${b.startLocation.coordinates[1].toFixed(5)}, ${b.startLocation.coordinates[0].toFixed(5)}` : 'N/A')}</div>
                  <div className="mt-1"><strong>End:</strong> {b.endName || (b.endLocation && b.endLocation.coordinates ? `${b.endLocation.coordinates[1].toFixed(5)}, ${b.endLocation.coordinates[0].toFixed(5)}` : 'N/A')}</div>
                  <div className="mt-1"><strong>Estimated End:</strong> {b.estimatedEndTime ? new Date(b.estimatedEndTime).toLocaleString() : 'N/A'}</div>
                  <div className="mt-1"><strong>Penalty Applied:</strong> {String(b.penaltyApplied)}</div>
                  <div className="mt-2 space-x-2">
                    <button onClick={()=>handleEndBookingById(b._id)} className="bg-green-600 text-white px-3 py-1 rounded">Complete Booking (Return)</button>
                    <button onClick={()=>handleCancelBooking(b._id)} className="bg-red-500 text-white px-3 py-1 rounded">Cancel Booking</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2">No active bookings. <a href="/booking/new" className="text-indigo-600">Create new booking</a></div>
          )}
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold">Returned Bookings</h3>
          {returnedBookings && returnedBookings.length>0 ? (
            <div className="space-y-3 mt-2">
              {returnedBookings.map(b=> (
                <div key={b._id} className="p-3 border rounded bg-yellow-50">
                  <div className="font-semibold">Returned Booking #{b._id}</div>
                  <div className="mt-1"><strong>Status:</strong> {b.status}</div>
                  <div className="mt-1"><strong>Penalty Amount:</strong> {b.penaltyAmount || 0}</div>
                  <div className="mt-1"><strong>Start Time:</strong> {b.startTime ? new Date(b.startTime).toLocaleString() : 'N/A'}</div>
                  <div className="mt-1"><strong>Returned At:</strong> {b.actualEndTime ? new Date(b.actualEndTime).toLocaleString() : 'N/A'}</div>
                  <div className="mt-1"><strong>Estimated End:</strong> {b.estimatedEndTime ? new Date(b.estimatedEndTime).toLocaleString() : 'N/A'}</div>
                  <div className="mt-1"><strong>Start Location:</strong> {b.startName || (b.startLocation && b.startLocation.coordinates ? `${b.startLocation.coordinates[1].toFixed(5)}, ${b.startLocation.coordinates[0].toFixed(5)}` : 'N/A')}</div>
                  <div className="mt-1"><strong>End Location:</strong> {b.endName || (b.endLocation && b.endLocation.coordinates ? `${b.endLocation.coordinates[1].toFixed(5)}, ${b.endLocation.coordinates[0].toFixed(5)}` : 'N/A')}</div>
                  <div className="mt-1"><strong>Penalty Applied:</strong> {String(b.penaltyApplied)}</div>
                  <div className="mt-2 text-sm text-yellow-700">Booking returned — waiting for guard verification. No actions available.</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2">No returned bookings.</div>
          )}
        </div>
      </div>

      {/* Inline payment form mounted in the profile area when user clicks Pay Penalty */}
      {showPaymentBookingId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-4 rounded shadow w-full max-w-md">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-lg font-semibold">Pay Penalty</h4>
              <button className="text-gray-600" onClick={()=>{ setShowPaymentBookingId(null); setPaymentAmount(0) }}>Close</button>
            </div>
            <StripePaymentWrapper bookingId={showPaymentBookingId} amount={paymentAmount} onSuccess={async (pi)=>{
              // refresh returned bookings and user
              try{
                const rRes = await api.get('/booking/returned', { params: { userId: user?._id } })
                setReturnedBookings(rRes?.data?.data || [])
                // fetch updated user
                const uRes = await getUser()
                const updatedUser = (uRes?.data?.statusCode===200 || uRes?.data?.success) ? (Array.isArray(uRes.data.data)? uRes.data.data[0] : uRes.data.data) : null
                if(updatedUser){ setUser(updatedUser); sessionStorage.setItem('user', JSON.stringify(updatedUser)) }
              }catch(e){}
              alert('Payment successful')
              setShowPaymentBookingId(null)
              setPaymentAmount(0)
            }} onError={(err)=>{ alert(err?.message || 'Payment failed') }} />
          </div>
        </div>
      )}
    </div>
  )
}
