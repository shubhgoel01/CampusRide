import React from "react";
import { formatClockTime } from "../../utils/uiFormatters";

export default function AdminStuckBookingsTable({ bookings, onOpenBooking }) {
  return (
    <div className="overflow-x-auto">
      <div className="p-4 bg-red-50 text-red-700 text-sm border-b border-red-100 mb-0">
        These bookings have been in <b>pending</b> state for more than 30
        minutes. They might be abandoned or have had a network failure.
      </div>
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 sticky top-0 z-10">
          <tr>
            <th className="px-6 py-4">User</th>
            <th className="px-6 py-4">Cycle</th>
            <th className="px-6 py-4">Started At</th>
            <th className="px-6 py-4">Elapsed Time</th>
            <th className="px-6 py-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bookings.length === 0 && (
            <tr>
              <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                No stuck bookings found for the current threshold (&gt; 30
                mins).
              </td>
            </tr>
          )}
          {bookings.map((b) => {
            const elapsed = Math.floor(
              (Date.now() - new Date(b.startTime).getTime()) / 60000,
            );
            return (
              <tr
                key={b._id}
                onClick={() => onOpenBooking(b)}
                className="odd:bg-white even:bg-slate-50/40 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4 font-medium text-slate-900">
                  {b.user?.fullName || b.userId}
                </td>
                <td className="px-6 py-4 font-mono text-xs">
                  {b.cycle?.cycleName || b.cycleId}
                </td>
                <td className="px-6 py-4">{formatClockTime(b.startTime)}</td>
                <td className="px-6 py-4">
                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold text-xs animate-pulse">
                    {elapsed} mins
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-primary hover:text-primary-dark font-medium text-xs">
                    View/Close
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
