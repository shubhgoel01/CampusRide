import React, { useEffect, useState } from 'react'
import { getBookings } from '../api'
import { ensureLocationsLoaded, formatLocation } from '../utils/locationCache'
import Card from '../components/Card'
import Skeleton from '../components/Skeleton'
import Modal from '../components/Modal'

export default function History() {
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState([])
  const [locationsList, setLocationsList] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  const resolveAndLog = (loc, bookingId, fieldName) => {
    try {
      const mapped = formatLocation(loc)
      // console.log('[LocationMap]','bookingId:', bookingId, 'field:', fieldName, 'original:', loc, 'mapped:', mapped)
      return mapped
    } catch (e) { console.error('[LocationMap] error mapping', bookingId, fieldName, e); return formatLocation(loc) }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const raw = sessionStorage.getItem('user')
        const u = raw ? JSON.parse(raw) : null
        if (!u) { setError('Not logged in'); setLoading(false); return }
        const res = await getBookings({ userId: u._id })
        setBookings(res?.data?.data || [])
        try {
          const list = await ensureLocationsLoaded()
          setLocationsList(list || [])
        } catch (e) { /* non-fatal */ }
      } catch (e) { setError('Failed to load bookings') }
      finally { setLoading(false) }
    }
    load()
  }, [])

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-semibold">Your Booking History</h2>
      {error && <div className="text-red-600">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookings.length === 0 && <div className="text-gray-500">No bookings found</div>}
        {bookings.map(b => (
          <div key={b._id} onClick={() => { setSelectedBooking(b); setShowModal(true) }} className="cursor-pointer transform transition-all duration-200 hover:scale-105">
            <div className="relative rounded-xl p-4 bg-gradient-to-br from-indigo-900/80 via-violet-800/70 to-sky-900/80 shadow-lg hover:shadow-2xl text-white">
              {/* cycle name + optional penalty badge */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-slate-300">Cycle</div>
                  <div className="font-semibold">{b.cycle?.cycleName || b.cycle?.cycleNumber || (b.cycleId ? String(b.cycleId).slice(0, 8) : '—')}</div>
                </div>
                {b.penaltyAmount != null && b.penaltyAmount > 0 && (
                  <div className="ml-3 px-3 py-1 rounded-full bg-red-600 text-white text-sm font-medium">₹{b.penaltyAmount}</div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <div className="text-xs text-slate-300">Start Time</div>
                  <div className="font-semibold">{b.startTime ? new Date(b.startTime).toLocaleString() : 'N/A'}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-300">End Time</div>
                  <div className="font-semibold">{b.actualEndTime ? new Date(b.actualEndTime).toLocaleString() : (b.estimatedEndTime ? new Date(b.estimatedEndTime).toLocaleString() : '—')}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-slate-300">Start Location</div>
                    <div className="text-sm">{resolveAndLog(b.startLocation || b.location || b.startLocation, b._id, 'startLocation')}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-300">Last Location</div>
                    <div className="text-sm">{resolveAndLog(b.endLocation || b.lastLocation || b.location, b._id, 'lastLocation')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedBooking && (
        <Modal open={showModal} onClose={() => { setShowModal(false); setSelectedBooking(null) }} title={`Ride Details`}>
          <div className="space-y-4 text-slate-900 dark:text-slate-100">
            <section>
              <h4 className="text-sm font-semibold text-indigo-700">Ride Info</h4>
              <div className="mt-2 grid grid-cols-1 gap-3">
                <div className="p-3 bg-white/60 rounded-md">
                  <div className="text-xs text-slate-500">Cycle</div>
                  <div className="font-medium text-slate-800 dark:text-white">{selectedBooking.cycle?.cycleName || selectedBooking.cycle?.cycleNumber || selectedBooking.cycleId || '—'}</div>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-sm font-semibold text-indigo-700">Timestamps</h4>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white/60 rounded-md">
                  <div className="text-xs text-slate-500">Start Time</div>
                  <div className="font-medium">{selectedBooking.startTime ? new Date(selectedBooking.startTime).toLocaleString() : 'N/A'}</div>
                </div>
                <div className="p-3 bg-white/60 rounded-md">
                  <div className="text-xs text-slate-500">Estimated / Actual End</div>
                  <div className="font-medium">{selectedBooking.actualEndTime ? new Date(selectedBooking.actualEndTime).toLocaleString() : (selectedBooking.estimatedEndTime ? new Date(selectedBooking.estimatedEndTime).toLocaleString() : '—')}</div>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-sm font-semibold text-indigo-700">Locations</h4>
              <div className="mt-2 grid grid-cols-1 gap-3">
                <div className="p-3 bg-white/60 rounded-md">
                  <div className="text-xs text-slate-500">Start Location</div>
                  <div className="font-medium">{resolveAndLog(selectedBooking.startLocation || selectedBooking.location || selectedBooking.startLocation, selectedBooking._id, 'startLocation')}</div>
                </div>
                <div className="p-3 bg-white/60 rounded-md">
                  <div className="text-xs text-slate-500">Last Location</div>
                  <div className="font-medium">{resolveAndLog(selectedBooking.endLocation || selectedBooking.lastLocation || selectedBooking.location, selectedBooking._id, 'lastLocation')}</div>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-sm font-semibold text-indigo-700">Status</h4>
              <div className="mt-2 p-3 bg-white/60 rounded-md">
                <div className="text-sm text-slate-800 dark:text-white">{selectedBooking.status || '—'}</div>
                {selectedBooking.penaltyAmount != null && (
                  <div className="text-sm mt-2 text-red-600 font-semibold">Penalty: ₹{selectedBooking.penaltyAmount}</div>
                )}
              </div>
            </section>

          </div>
        </Modal>
      )}
    </div>
  )
}
