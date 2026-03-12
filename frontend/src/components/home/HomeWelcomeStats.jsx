import React, { memo } from "react";
import { formatCurrencyFromPaise } from "../../utils/uiFormatters";

function HomeWelcomeStats({ user, activeCount, returnedCount, onPayPenalty }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="page-title text-2xl md:text-2xl">
            Hello, {user?.fullName?.split(" ")[0] || "Student"}
          </h1>
          <p className="page-subtitle text-sm md:text-sm">
            Ready to ride today?
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <div className="text-center flex-1 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary/20 transition-colors">
          <div className="text-3xl font-bold text-primary">{activeCount}</div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">
            Active
          </div>
        </div>

        {user?.penaltyAmount > 0 ? (
          <div className="text-center flex-1 p-4 bg-red-50 rounded-xl border border-red-100 relative group">
            <div className="text-3xl font-bold text-red-600">
              {formatCurrencyFromPaise(user.penaltyAmount)}
            </div>
            <div className="text-xs text-red-500 font-bold uppercase tracking-wide mt-1">
              Penalty
            </div>

            <button
              onClick={onPayPenalty}
              className="absolute inset-0 w-full h-full bg-red-600 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-sm shadow-lg"
            >
              Pay Now
            </button>
          </div>
        ) : (
          <div className="text-center flex-1 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary/20 transition-colors">
            <div className="text-3xl font-bold text-slate-800">
              {returnedCount}
            </div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">
              History
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(HomeWelcomeStats);
