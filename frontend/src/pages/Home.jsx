import React, { useEffect, useState, useCallback } from 'react'
import { getUser, getActiveBookings, settlePenalty, endBooking, cancelBooking, getReturnedBookings, getAvailableCycles, createBooking, getLocations, getBookings } from '../api'
import api from '../api'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import StripePaymentWrapper from '../components/StripePayment'
import Modal from '../components/Modal'
import BookingModal from '../components/BookingModal'
import { ensureLocationsLoaded, formatLocation } from '../utils/locationCache'
import { MapIcon, HistoryIcon, InfoIcon, SupportIcon, SearchIcon } from '../components/Icons'
import { useNavigate } from 'react-router-dom'
import MapWidget from '../components/MapWidget'

export default function Home() {
  const [user, setUser] = useState(null)
  const [activeBookings, setActiveBookings] = useState([])
  const [returnedBookings, setReturnedBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPaymentBookingId, setShowPaymentBookingId] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const navigate = useNavigate()

  const reloadBookings = useCallback(async (userId) => {
    try {
      const aRes = await getActiveBookings(userId ? { userId } : {})
      setActiveBookings(aRes?.data?.data || [])
      const rRes = await getReturnedBookings(userId ? { userId } : {})
      setReturnedBookings(rRes?.data?.data || [])
    } catch (err) {
      console.error('Failed to load bookings', err)
    }
  }, [])

  // locations list for start/end selectors
  const [locationsList, setLocationsList] = useState([])
  const [startLoc, setStartLoc] = useState('')
  const [endLoc, setEndLoc] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [foundCycle, setFoundCycle] = useState(null)

  const loadUserAndBookings = useCallback(async () => {
    setLoading(true)
    try {
      // prefer cached user for quick render
      const cached = sessionStorage.getItem('user')
      let currentUser = null
      if (cached) { try { currentUser = JSON.parse(cached) } catch (e) { } }

      // fetch latest user from backend (no param returns current user)
      const uRes = await getUser()
      const fetched = (uRes?.data?.statusCode === 200 || uRes?.data?.success) ? (Array.isArray(uRes.data.data) ? uRes.data.data[0] : uRes.data.data) : null
      if (fetched) currentUser = fetched

      setUser(currentUser)
      if (currentUser) sessionStorage.setItem('user', JSON.stringify(currentUser))
      await reloadBookings(currentUser?._id)
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.message || 'Failed to load data')
    } finally { setLoading(false) }
  }, [reloadBookings])

  useEffect(() => { loadUserAndBookings() }, [loadUserAndBookings])

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const list = await ensureLocationsLoaded()
        setLocationsList(list || [])
      } catch (e) { console.error('Failed load locations', e) }
    }
    // load cache once on mount
    loadLocations()
  }, [])



  const handlePayPenalty = () => {
    if (!user) return alert('No user loaded')
    if (!user.penaltyAmount || user.penaltyAmount <= 0) return alert('No penalty to pay')

    // Open Stripe Payment Modal
    // We use a dummy 24-char hex string to satisfy Mongoose ObjectId requirement if strictly validated
    const dummyPenaltyId = "000000000000000000000000"
    // user.penaltyAmount is in paise, but payment processing expects rupees
    const penaltyInRupees = user.penaltyAmount / 100
    openBookingPayment(dummyPenaltyId, penaltyInRupees)
  }

  const handleEndBookingById = async (bookingId) => {
    try {
      const res = await endBooking(bookingId)
      if (res?.data?.statusCode === 200 || res?.data?.success) {
        alert('Booking ended – waiting for guard verification')
        await reloadBookings(user?._id)
      }
    } catch (err) { alert(err?.response?.data?.message || 'Failed to end booking') }
  }

  const handleCancelBooking = async (bookingId) => {
    if (!bookingId) return
    try {
      const res = await cancelBooking(bookingId)
      if (res?.data?.statusCode === 200 || res?.data?.success) {
        alert('Booking cancelled')
        await reloadBookings(user?._id)
      }
    } catch (err) { alert(err?.response?.data?.message || 'Failed to cancel booking') }
  }

  const openBookingPayment = (bookingId, amount) => {
    setPaymentAmount(amount)
    setShowPaymentBookingId(bookingId)
  }

  const [showActiveModal, setShowActiveModal] = useState(false)
  const [selectedActiveBooking, setSelectedActiveBooking] = useState(null)

  // returned booking modal state 
  const [showReturnedModal, setShowReturnedModal] = useState(false)
  const [selectedReturnedBooking, setSelectedReturnedBooking] = useState(null)

  const openActiveBooking = (b) => {
    setSelectedActiveBooking(b)
    setShowActiveModal(true)
  }

  const closeActiveBooking = () => {
    setSelectedActiveBooking(null)
    setShowActiveModal(false)
  }

  const openReturnedBooking = (b) => {
    setSelectedReturnedBooking(b)
    setShowReturnedModal(true)
  }

  const closeReturnedBooking = () => {
    setSelectedReturnedBooking(null)
    setShowReturnedModal(false)
  }
  // elapsed timer for modal (ms)
  const [elapsedMs, setElapsedMs] = useState(0)

  useEffect(() => {
    // If we have an active booking (card visible), run the timer
    const booking = activeBookings && activeBookings.length > 0 ? activeBookings[0] : null
    if (!booking) {
      setElapsedMs(0)
      return
    }

    const start = booking.startTime ? new Date(booking.startTime).getTime() : Date.now()
    setElapsedMs(Math.max(0, Date.now() - start)) // immediate update

    const t = setInterval(() => {
      setElapsedMs(Math.max(0, Date.now() - start))
    }, 1000)

    return () => clearInterval(t)
  }, [activeBookings])

  const formatDuration = (ms) => {
    if (ms == null || isNaN(ms)) return '00:00:00'
    const total = Math.floor(ms / 1000)
    const hrs = Math.floor(total / 3600)
    const mins = Math.floor((total % 3600) / 60)
    const secs = total % 60
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const renderCycleName = (b) => {
    if (!b) return '—'
    const cycle = b.cycle || {}
    return cycle.cycleName || cycle.cycleNumber || b.cycleName || b.cycleNumber || (b.cycleId ? String(b.cycleId).slice(0, 8) : '—')
  }

  const renderUserName = (b) => {
    if (!b) return '—'
    const u = b.user || {}
    return u.fullName || u.userName || b.userName || b.userId || '—'
  }

  // Find cycle near start location
  const handleFindCycle = async () => {
    setError('')
    setIsSearching(true)
    setFoundCycle(null)
    try {
      if (!startLoc || !endLoc) return setError('Please select start and destination')
      if (startLoc === endLoc) return setError('Start and destination cannot be the same')
      const res = await getAvailableCycles({ location: startLoc })
      if (res?.data?.statusCode === 200 || res?.data?.success) {
        const c = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data
        if (c) setFoundCycle(c)
        else setError('No cycles available nearby')
      }
    } catch (err) { setError(err?.response?.data?.message || 'Failed to find cycles') }
    finally { setIsSearching(false) }
  }

  const handleCreateBooking = async () => {
    setError('')
    setIsCreating(true)
    try {
      // guard: prevent creating a new booking if user has outstanding penalty or any existing booking
      if (user && (user.penaltyAmount && Number(user.penaltyAmount) > 0)) {
        alert('You have an outstanding penalty. Please pay it before creating a new booking.')
        setIsCreating(false)
        return
      }
      if ((activeBookings && activeBookings.length > 0) || (returnedBookings && returnedBookings.length > 0)) {
        alert('You already have an active or recently returned booking. Please resolve it before creating a new booking.')
        setIsCreating(false)
        return
      }
      if (!foundCycle) return setError('No cycle selected/found')
      const payload = { cycleId: foundCycle._id, isRoundTrip: false, location: [String(startLoc).trim(), String(endLoc).trim()] }
      const res = await createBooking(payload)
      if (res?.data?.statusCode === 201 || res?.data?.success) {
        alert('Booking created')
        await loadUserAndBookings()
      } else {
        const msg = res?.data?.message || res?.data?.error || 'Failed to create booking'
        setError(msg)
        alert(msg)
      }
    } catch (err) { setError(err?.response?.data?.message || 'Failed to create booking') }
    finally { setIsCreating(false) }
  }

  if (loading) return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-4 animate-pulse bg-slate-100"></div>
      <div className="space-y-6">
        <div className="h-64 bg-white rounded-xl shadow-sm border border-slate-200 animate-pulse bg-slate-100"></div>
        <div className="h-32 bg-white rounded-xl shadow-sm border border-slate-200 animate-pulse bg-slate-100"></div>
      </div>
    </div>
  )

  return (
    <div className="h-[calc(100vh-6rem)] grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">

      {/* Left Column: Map */}
      <div className="lg:col-span-2 flex flex-col gap-4 h-full">
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
          <MapWidget locations={locationsList} />
        </div>
      </div>

      {/* Right Column: Key Actions */}
      <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-4">

        {/* Welcome Card & Stats */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Hello, {user?.fullName?.split(' ')[0] || 'Student'}</h1>
              <p className="text-slate-500 text-sm mt-1">Ready to ride today?</p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="text-center flex-1 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary/20 transition-colors">
              <div className="text-3xl font-bold text-primary">{activeBookings.length}</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">Active</div>
            </div>

            {/* Conditional Stats: Show Penalty if > 0, else show Total History */}
            {user?.penaltyAmount > 0 ? (
              <div className="text-center flex-1 p-4 bg-red-50 rounded-xl border border-red-100 relative group">
                <div className="text-3xl font-bold text-red-600">₹{(user.penaltyAmount / 100).toFixed(2)}</div>
                <div className="text-xs text-red-500 font-bold uppercase tracking-wide mt-1">Penalty</div>

                {/* Hover/Action to Pay */}
                <button onClick={handlePayPenalty} className="absolute inset-0 w-full h-full bg-red-600 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-sm shadow-lg">
                  Pay Now
                </button>
              </div>
            ) : (
              <div className="text-center flex-1 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary/20 transition-colors">
                <div className="text-3xl font-bold text-slate-800">{returnedBookings.length}</div>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">History</div>
              </div>
            )}
          </div>
        </div>

        {/* Status Cards Area: Active Ride OR Waiting Verification */}
        {activeBookings && activeBookings.length > 0 && (
          // ACTIVE RIDE VIEW
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-none flex flex-col justify-between relative overflow-hidden mb-6">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <svg className="w-32 h-32 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" opacity="0.3"></path><path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 18c4.41 0 8-3.59 8-8 s-3.59-8-8-8 3.59-8 8 8z"></path></svg>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Ride in Progress</h2>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="space-y-1">
                  <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Cycle Number</div>
                  <div className="text-2xl font-mono font-bold text-slate-700">{renderCycleName(activeBookings[0])}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Elapsed Time</div>
                  <div className="text-2xl font-mono font-bold text-primary">{formatDuration(elapsedMs)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Start Time</div>
                  <div className="text-lg font-medium text-slate-600">
                    {activeBookings[0].startTime ? new Date(activeBookings[0].startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Start Location</div>
                  <div className="text-lg font-medium text-slate-600 truncate" title={activeBookings[0].startLocationName || formatLocation(activeBookings[0].startLocation || activeBookings[0].location)}>
                    {activeBookings[0].startLocationName || formatLocation(activeBookings[0].startLocation || activeBookings[0].location)}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="bg-yellow-100 text-yellow-600 p-1.5 rounded-lg">
                    <HistoryIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-700">Return Instructions</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Please park the cycle at a designated station and ensure it is locked.
                      Click the button below to initiate the return process.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleEndBookingById(activeBookings[0]._id)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold shadow-lg shadow-red-500/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>End Ride & Return Cycle</span>
              </button>

              <button
                onClick={() => openActiveBooking(activeBookings[0])}
                className="w-full py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-semibold text-sm transition-colors"
              >
                View Full Receipt Details
              </button>
            </div>
          </div>
        )}

        {(!activeBookings || activeBookings.length === 0) && returnedBookings && returnedBookings.length > 0 && (
          // RETURNED / PENDING VERIFICATION VIEW
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-none mb-6 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Waiting for Verification</h2>
            </div>
            <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 p-4 rounded-xl text-sm leading-relaxed mb-4">
              Your last ride with cycle <span className="font-bold font-mono">{renderCycleName(returnedBookings[0])}</span> has been ended.
              Please wait for the guard to verify the return. You cannot rent a new cycle until this verification is complete.
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-500 mb-6">
              <div>
                <span className="font-semibold block text-slate-700 mb-0.5">Ended At</span>
                {returnedBookings[0].actualEndTime ? new Date(returnedBookings[0].actualEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </div>
              <div>
                <span className="font-semibold block text-slate-700 mb-0.5">Drop-off Location</span>
                <span title={returnedBookings[0].endLocationName || formatLocation(returnedBookings[0].endLocation || returnedBookings[0].location)} className="truncate block">
                  {returnedBookings[0].endLocationName || formatLocation(returnedBookings[0].endLocation || returnedBookings[0].location)}
                </span>
              </div>
            </div>

            <button
              onClick={() => openReturnedBooking(returnedBookings[0])}
              className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              View Full Receipt Details
            </button>
          </div>
        )}

        {/* RENT FORM VIEW - Always visible but Disabled if Active/Returned exists */}
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1 transition-opacity ${((activeBookings && activeBookings.length > 0) || (returnedBookings && returnedBookings.length > 0)) ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full"></span>
            Rent a Cycle
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Pick-up Location</label>
              <select disabled={(activeBookings && activeBookings.length > 0) || (returnedBookings && returnedBookings.length > 0)} value={startLoc} onChange={e => setStartLoc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-primary p-2.5 outline-none transition-all disabled:opacity-50">
                <option value="">Select station...</option>
                {locationsList.map(l => <option key={l._id} value={l.name || l._id}>{l.name || String(l._id)}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Drop-off Location</label>
              <select disabled={(activeBookings && activeBookings.length > 0) || (returnedBookings && returnedBookings.length > 0)} value={endLoc} onChange={e => setEndLoc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-primary p-2.5 outline-none transition-all disabled:opacity-50">
                <option value="">Select destination...</option>
                {locationsList.map(l => <option key={l._id} value={l.name || l._id}>{l.name || String(l._id)}</option>)}
              </select>
            </div>

            {/* Availability / Status Message */}
            <div className="min-h-[2rem]">
              {isSearching && <div className="text-sm text-primary animate-pulse">Searching for available cycles...</div>}
              {!isSearching && foundCycle && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div>
                    <div className="text-sm font-semibold text-green-800">{foundCycle.cycleName || 'Cycle Available'}</div>
                    <div className="text-xs text-green-600">Ready to book</div>
                  </div>
                </div>
              )}
              {!isSearching && !foundCycle && error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            <button
              onClick={foundCycle ? handleCreateBooking : handleFindCycle}
              disabled={isSearching || isCreating || (activeBookings && activeBookings.length > 0) || (returnedBookings && returnedBookings.length > 0)}
              className="w-full btn-primary justify-center py-3 text-base shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Checking Availability...' : foundCycle ? (isCreating ? 'Confirm Booking' : 'Book Now') : 'Find Cycle'}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase">Or</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button disabled={true} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 font-semibold cursor-not-allowed">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
              Scan QR Code (Disabled)
            </button>

          </div>
        </div>
      </div>

      {/* Payment modal for penalties */}
      {showPaymentBookingId && (
        <Modal open={true} onClose={() => { setShowPaymentBookingId(null); setPaymentAmount(0) }} title="Pay Penalty">
          <StripePaymentWrapper bookingId={showPaymentBookingId} amount={paymentAmount} onSuccess={async () => {
            alert('Payment successful! Penalty cleared.')
            await loadUserAndBookings()
            setShowPaymentBookingId(null)
            setPaymentAmount(0)
          }} onError={(err) => { alert(err?.message || 'Payment failed') }} />
        </Modal>
      )}

      {/* Modals remain same but handled by state */}
      {selectedActiveBooking && (
        <BookingModal open={showActiveModal} booking={selectedActiveBooking} onClose={closeActiveBooking} locations={locationsList} />
      )}
      {selectedReturnedBooking && (
        <BookingModal open={showReturnedModal} booking={selectedReturnedBooking} onClose={closeReturnedBooking} locations={locationsList} />
      )}
    </div>
  )
}
