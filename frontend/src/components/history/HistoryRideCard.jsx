import React from "react";
import { formatLocation } from "../../utils/locationCache";
import { formatCurrencyFromPaise } from "../../utils/uiFormatters";

function HistoryStatusBadge({ status }) {
  const styles = {
    active: "bg-green-50 text-green-700 border-green-100 ring-green-600/20",
    returned: "bg-slate-50 text-slate-700 border-slate-200 ring-slate-600/10",
    completed: "bg-blue-50 text-blue-700 border-blue-100 ring-blue-600/20",
    canceled: "bg-red-50 text-red-700 border-red-100 ring-red-600/10",
    pending:
      "bg-yellow-50 text-yellow-700 border-yellow-100 ring-yellow-600/20",
  };
  const normalized = String(status || "").toLowerCase();
  const activeClass = styles[normalized] || styles.returned;

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ring-1 ring-inset ${activeClass} capitalize`}
    >
      {status === "returned" ? "Completed" : status}
    </span>
  );
}

export default function HistoryRideCard({ booking, onClick }) {
  const dateObj = new Date(booking.startTime);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleString("default", { month: "short" });
  const time = dateObj.toLocaleString("default", {
    hour: "numeric",
    minute: "2-digit",
  });
  const hasPenalty = booking.penaltyAmount && booking.penaltyAmount > 0;

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
    >
      <div className="flex items-center gap-4">
        <div className="flex-none flex flex-col items-center justify-center w-16 h-16 bg-slate-50 rounded-xl border border-slate-100 group-hover:border-primary/20 group-hover:bg-primary/5 transition-colors">
          <span className="text-xl font-bold text-slate-700 group-hover:text-primary">
            {day}
          </span>
          <span className="text-xs font-medium text-slate-400 uppercase">
            {month}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-900 truncate">
              {booking.cycle?.cycleName || booking.cycleId
                ? `Item ${booking.cycle?.cycleName || String(booking.cycleId).slice(0, 8)}`
                : "Cycle Ride"}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">{time}</span>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <div className="flex items-center gap-1 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
              <span className="truncate">
                {formatLocation(
                  booking.startLocationName || booking.startLocation,
                )}
              </span>
            </div>
            <span className="text-slate-300">→</span>
            <div className="flex items-center gap-1 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
              <span className="truncate">
                {booking.actualEndTime
                  ? formatLocation(
                      booking.endLocationName || booking.endLocation,
                    )
                  : booking.status === "pending"
                    ? "In Progress"
                    : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-none flex flex-col items-end gap-2">
          <HistoryStatusBadge status={booking.status} />
          {hasPenalty && (
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              Penalty: {formatCurrencyFromPaise(booking.penaltyAmount)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
