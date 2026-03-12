import React from "react";
import StatusBadge from "./StatusBadge";
import { formatLocation } from "../../utils/locationCache";
import { formatClockTime } from "../../utils/uiFormatters";

export default function AdminActiveRidesTable({ bookings, onOpenBooking }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 sticky top-0 z-10">
          <tr>
            <th className="px-6 py-4">User</th>
            <th className="px-6 py-4">Cycle</th>
            <th className="px-6 py-4">Start Time</th>
            <th className="px-6 py-4">Location</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bookings.map((b) => (
            <tr
              key={b._id}
              onClick={() => onOpenBooking(b)}
              className="odd:bg-white even:bg-slate-50/40 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <td className="px-6 py-4 font-medium text-slate-900">
                {b.user?.fullName || b.userId}
              </td>
              <td className="px-6 py-4 font-mono text-xs">
                {b.cycle?.cycleName || b.cycleId}
              </td>
              <td className="px-6 py-4">{formatClockTime(b.startTime)}</td>
              <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-[200px] truncate">
                {formatLocation(b.startLocation)}
              </td>
              <td className="px-6 py-4">
                <StatusBadge status="pending" />
              </td>
            </tr>
          ))}
          {bookings.length === 0 && (
            <tr>
              <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                No active rides right now. Live rides will appear here.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
