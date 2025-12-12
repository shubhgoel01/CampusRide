import React from 'react'
import Modal from './Modal'
import { ensureLocationsLoaded, formatLocation, getCachedLocations, setCachedLocations } from '../utils/locationCache'

export default function BookingModal({ open, booking, onClose }) {
  if (!booking) return null

    // Ensure cache is loaded
    ; (async () => { try { await ensureLocationsLoaded() } catch (e) { } })()

  const renderLocationName = (name, loc) => {
    if (name) return name;
    return formatLocation(loc);
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'


  // Calculate Duration if available
  const getDuration = () => {
    if (booking.duration) {
      const m = Math.floor(booking.duration / 60);
      return `${m} mins`
    }
    if (booking.startTime && booking.actualEndTime) {
      const diff = new Date(booking.actualEndTime) - new Date(booking.startTime)
      const m = Math.floor(diff / 60000)
      return `${m} mins`
    }
    return '—'
  }


  return (
    <Modal open={open} onClose={onClose} title="Ride Receipt" footer={null}>
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 relative overflow-hidden">

        {/* Decorative Ticket Circles */}
        <div className="absolute -left-3 top-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full transform -translate-y-1/2"></div>
        <div className="absolute -right-3 top-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full transform -translate-y-1/2"></div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wide mb-2">
            {booking.status}
          </div>
          <div className="text-3xl font-bold text-slate-800">
            {booking.penaltyAmount && booking.penaltyAmount > 0 ? `₹${(booking.penaltyAmount / 100).toFixed(2)}` : '₹0.00'}
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Total Paid</div>
        </div>

        {/* Dotted Divider */}
        <div className="border-t-2 border-dashed border-slate-300 my-6 relative"></div>

        {/* Details Grid */}
        <div className="space-y-4">

          {/* Cycle */}
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-sm">Cycle</span>
            <span className="font-mono font-bold text-slate-700">{booking.cycle?.cycleNumber || booking.cycle?.cycleName || booking.cycleId || '—'}</span>
          </div>

          {/* Date */}
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-sm">Date</span>
            <span className="font-medium text-slate-700">{formatDate(booking.startTime)}</span>
          </div>

          {/* Duration */}
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-sm">Duration</span>
            <span className="font-medium text-slate-700">{getDuration()}</span>
          </div>

          <div className="h-px bg-slate-100 my-2"></div>

          {/* Start Location */}
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs uppercase font-bold mt-1">Start At</span>
            <div className="text-right">
              <div className="font-medium text-slate-800 text-sm">{renderLocationName(booking.startLocationName, booking.startLocation)}</div>
              <div className="text-xs text-slate-400 font-mono">{formatTime(booking.startTime)}</div>
            </div>
          </div>

          {/* End Location */}
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs uppercase font-bold mt-1">To</span>
            <div className="text-right">
              <div className="font-medium text-slate-800 text-sm">
                {renderLocationName(booking.endLocationName, booking.endLocation || booking.location || booking.startLocation)}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {booking.actualEndTime ? formatTime(booking.actualEndTime) : (booking.estimatedEndTime ? `Est: ${formatTime(booking.estimatedEndTime)}` : '—')}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <div className="text-[10px] text-slate-400 font-mono mb-1">Booking ID: {booking._id}</div>
          <div className="flex justify-center gap-1">
            {[...Array(12)].map((_, i) => <div key={i} className="w-1 h-8 bg-slate-200"></div>)}
          </div>
        </div>

      </div>
    </Modal>
  )
}
