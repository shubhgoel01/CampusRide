import React from "react";
import BookingModal from "../components/BookingModal";
import { useRideHistory } from "../hooks/useRideHistory";
import HistoryStats from "../components/history/HistoryStats";
import HistoryFilterTabs from "../components/history/HistoryFilterTabs";
import HistoryRideCard from "../components/history/HistoryRideCard";

export default function History() {
  const {
    loading,
    filter,
    stats,
    filteredBookings,
    selectedBooking,
    setFilter,
    setSelectedBooking,
  } = useRideHistory();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Rides</h1>
          <p className="text-slate-500 mt-1">
            View your travel history and active bookings
          </p>
        </div>

        <HistoryStats stats={stats} />
      </div>

      <HistoryFilterTabs filter={filter} onFilterChange={setFilter} />

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
              <svg
                className="w-8 h-8 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900">
              No rides found
            </h3>
            <p className="text-slate-500 mt-1">
              You haven't made any bookings in this category.
            </p>
          </div>
        )}

        {!loading &&
          filteredBookings.map((booking) => (
            <HistoryRideCard
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
  );
}
