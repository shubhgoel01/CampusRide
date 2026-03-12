import React, { memo } from "react";
import { formatClockTime } from "../../utils/uiFormatters";

function ReturnedBookingCard({
  booking,
  cycleLabel,
  endLocationLabel,
  onView,
}) {
  if (!booking) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-none mb-6 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">
          Waiting for Verification
        </h2>
      </div>
      <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 p-4 rounded-xl text-sm leading-relaxed mb-4">
        Your last ride with cycle{" "}
        <span className="font-bold font-mono">{cycleLabel}</span> has been
        ended. Please wait for the guard to verify the return. You cannot rent a
        new cycle until this verification is complete.
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm text-slate-500 mb-6">
        <div>
          <span className="font-semibold block text-slate-700 mb-0.5">
            Ended At
          </span>
          {formatClockTime(booking.actualEndTime)}
        </div>
        <div>
          <span className="font-semibold block text-slate-700 mb-0.5">
            Drop-off Location
          </span>
          <span title={endLocationLabel} className="truncate block">
            {endLocationLabel}
          </span>
        </div>
      </div>

      <button
        onClick={() => onView(booking)}
        className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        View Full Receipt Details
      </button>
    </div>
  );
}

export default memo(ReturnedBookingCard);
