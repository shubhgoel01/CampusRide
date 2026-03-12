import React from "react";

const tabs = [
  { key: "all", label: "All Rides" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

export default function HistoryFilterTabs({ filter, onFilterChange }) {
  return (
    <div className="border-b border-slate-200">
      <div className="flex gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onFilterChange(tab.key)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              filter === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
