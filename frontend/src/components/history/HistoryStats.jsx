import React from "react";

export default function HistoryStats({ stats }) {
  return (
    <div className="flex gap-4">
      <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-xs text-slate-400 font-bold uppercase">
          Total Rides
        </div>
        <div className="text-xl font-bold text-slate-800">{stats.total}</div>
      </div>
      {stats.penalties > 0 && (
        <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-100 shadow-sm">
          <div className="text-xs text-red-400 font-bold uppercase">
            Penalties Paid
          </div>
          <div className="text-xl font-bold text-red-600">
            ₹{stats.penalties.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
