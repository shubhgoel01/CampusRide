import React from "react";
import { formatLocation } from "../../utils/locationCache";
import {
  formatClockTime,
  formatCurrencyFromPaise,
} from "../../utils/uiFormatters";

export default function GuardReturnsTable({ loading, items, onMarkReceived }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">
          Returns Pending Verification
        </h3>
        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
          {items.length} Pending
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Cycle</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Return Location</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4">Penalty</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-12 text-center text-slate-400"
                >
                  Loading pending returns...
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-12 text-center text-slate-400"
                >
                  No bookings waiting for verification.
                </td>
              </tr>
            )}
            {!loading &&
              items.map((item) => {
                const diff =
                  new Date(item.actualEndTime).getTime() -
                  new Date(item.startTime).getTime();
                const minutes = Math.max(0, Math.floor(diff / 60000));
                const durationLabel =
                  minutes < 60
                    ? `${minutes}m`
                    : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

                return (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-slate-700">
                        {item.cycle?.cycleName || "-"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatClockTime(item.actualEndTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {item.user?.fullName ||
                        item.user?.userName ||
                        item.userId}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {item.endLocationName ||
                          formatLocation(item.endLocation)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {durationLabel}
                    </td>
                    <td className="px-6 py-4">
                      {item.penaltyAmount > 0 ? (
                        <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded-md text-xs">
                          {formatCurrencyFromPaise(item.penaltyAmount)}
                        </span>
                      ) : (
                        <span className="text-slate-300">₹0.00</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onMarkReceived(item._id)}
                        className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all transform active:scale-95"
                      >
                        Verify & Accept
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
