import React, { useEffect, useState, useMemo } from 'react'
import { getBookings } from '../api'
import { ensureLocationsLoaded, formatLocation } from '../utils/locationCache'
import BookingModal from '../components/BookingModal'
import Skeleton from '../components/Skeleton'

// Status Badge Component
const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-green-50 text-green-700 border-green-100 ring-green-600/20',
    returned: 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-600/10',
    completed: 'bg-blue-50 text-blue-700 border-blue-100 ring-blue-600/20',
    canceled: 'bg-red-50 text-red-700 border-red-100 ring-red-600/10',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-100 ring-yellow-600/20',
  }
  const s = String(status || '').toLowerCase()
  const activeClass = styles[s] || styles.returned

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ring-1 ring-inset ${activeClass} capitalize`}>
      {status === 'returned' ? 'Completed' : status}
    </span>
  )
}

// Ride Card Component
const RideCard = ({ booking, onClick }) => {
  const dateObj = new Date(booking.startTime)
  const day = dateObj.getDate()
  const month = dateObj.toLocaleString('default', { month: 'short' })
  const time = dateObj.toLocaleString('default', { hour: 'numeric', minute: '2-digit' })

  const isPenalty = booking.penaltyAmount && booking.penaltyAmount > 0

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
    >
      <div className="flex items-center gap-4">
        {/* Date Box */}
        <div className="flex-none flex flex-col items-center justify-center w-16 h-16 bg-slate-50 rounded-xl border border-slate-100 group-hover:border-primary/20 group-hover:bg-primary/5 transition-colors">
          <span className="text-xl font-bold text-slate-700 group-hover:text-primary">{day}</span>
          <span className="text-xs font-medium text-slate-400 uppercase">{month}</span>
        </div>

        {/* Ride Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-900 truncate">
              {booking.cycle?.cycleName || booking.cycleId ? `Item ${booking.cycle?.cycleName || String(booking.cycleId).slice(0, 8)}` : 'Cycle Ride'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">{time}</span>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <div className="flex items-center gap-1 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
              <span className="truncate">{formatLocation(booking.startLocationName || booking.startLocation)}</span>
            </div>
            <span className="text-slate-300">→</span>
            <div className="flex items-center gap-1 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
              <span className="truncate">
                {booking.actualEndTime
                  ? formatLocation(booking.endLocationName || booking.endLocation)
                  : (booking.status === 'active' ? 'In Progress' : '—')}
              </span>
            </div>
          </div>
        </div>

        {/* Status & Price */}
        <div className="flex-none flex flex-col items-end gap-2">
          <StatusBadge status={booking.status} />
          {isPenalty && (
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              Penalty: ₹{(booking.penaltyAmount / 100).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function History() {
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('all') // all, active, completed
  const [selectedBooking, setSelectedBooking] = useState(null)

  // Stats
  const stats = useMemo(() => {
    const total = bookings.length
    const active = bookings.filter(b => b.status === 'active' || b.status === 'pending').length
    // penalties sum in Rupees
    const penalties = bookings.reduce((acc, b) => acc + (b.penaltyAmount || 0), 0) / 100
    return { total, active, penalties }
  }, [bookings])

  const filteredBookings = useMemo(() => {
    if (filter === 'active') return bookings.filter(b => b.status === 'active' || b.status === 'pending')
    if (filter === 'completed') return bookings.filter(b => b.status === 'returned' || b.status === 'completed')
    return bookings
  }, [bookings, filter])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const raw = sessionStorage.getItem('user')
        const u = raw ? JSON.parse(raw) : null
        if (!u) return

        await ensureLocationsLoaded() // pre-load locations
        const res = await getBookings({ userId: u._id })

        // Sort by date desc
        const sorted = (res?.data?.data || []).sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        setBookings(sorted)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Rides</h1>
          <p className="text-slate-500 mt-1">View your travel history and active bookings</p>
        </div>

        {/* Simple Stats Row */}
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-400 font-bold uppercase">Total Rides</div>
            <div className="text-xl font-bold text-slate-800">{stats.total}</div>
          </div>
          {stats.penalties > 0 && (
            <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-100 shadow-sm">
              <div className="text-xs text-red-400 font-bold uppercase">Penalties Paid</div>
              <div className="text-xl font-bold text-red-600">₹{stats.penalties.toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          <button
            onClick={() => setFilter('all')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${filter === 'all' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            All Rides
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${filter === 'active' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${filter === 'completed' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading && (
          <div className="space-y-4">
            <div className="h-24 bg-white rounded-2xl animate-pulse"></div>
            <div className="h-24 bg-white rounded-2xl animate-pulse"></div>
            <div className="h-24 bg-white rounded-2xl animate-pulse"></div>
          </div>
        )}

        {!loading && filteredBookings.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900">No rides found</h3>
            <p className="text-slate-500 mt-1">You haven't made any bookings in this category.</p>
          </div>
        )}

        {!loading && filteredBookings.map(booking => (
          <RideCard
            key={booking._id}
            booking={booking}
            onClick={() => setSelectedBooking(booking)}
          />
        ))}
      </div>

      {/* Detail Modal */}
      {selectedBooking && (
        <BookingModal
          open={!!selectedBooking}
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  )
}
