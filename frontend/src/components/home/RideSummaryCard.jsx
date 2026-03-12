import React, { memo } from "react";
import { HistoryIcon } from "../Icons";
import {
  formatDurationFromMs,
  formatClockTime,
} from "../../utils/uiFormatters";

function RideSummaryCard({
  booking,
  cycleLabel,
  elapsedMs,
  startLocationLabel,
  onEnd,
  onView,
}) {
  if (!booking) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-none flex flex-col justify-between relative overflow-hidden mb-6">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Ride in Progress
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="space-y-1">
            <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Cycle Number
            </div>
            <div className="text-2xl font-mono font-bold text-slate-700">
              {cycleLabel}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Elapsed Time
            </div>
            <div className="text-2xl font-mono font-bold text-primary">
              {formatDurationFromMs(elapsedMs)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Start Time
            </div>
            <div className="text-lg font-medium text-slate-600">
              {formatClockTime(booking.startTime)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Start Location
            </div>
            <div
              className="text-lg font-medium text-slate-600 truncate"
              title={startLocationLabel}
            >
              {startLocationLabel}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-yellow-100 text-yellow-600 p-1.5 rounded-lg">
              <HistoryIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-700">
                Return Instructions
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Please park the cycle at a designated station and ensure it is
                locked. Click the button below to initiate the return process.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => onEnd(booking._id)}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold shadow-lg shadow-red-500/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <span>End Ride & Return Cycle</span>
        </button>

        <button
          onClick={() => onView(booking)}
          className="w-full py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-semibold text-sm transition-colors"
        >
          View Full Receipt Details
        </button>
      </div>
    </div>
  );
}

export default memo(RideSummaryCard);
