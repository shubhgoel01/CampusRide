import React from "react";

export default function AdminStatCard({
  title,
  value,
  icon,
  color = "blue",
  subtext,
  filter,
  onFilterChange,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
          {icon}
        </div>
        {filter && (
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
        <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mt-1">
          {title}
        </p>
        {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
      </div>
    </div>
  );
}
