import React from "react";

export default function GuardFilters({
  locations,
  filterLocation,
  searchQuery,
  onFilterLocationChange,
  onSearchQueryChange,
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search by User, Cycle ID..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="pl-10 w-full bg-white border border-slate-200 rounded-xl py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
      </div>
      <div className="sm:w-64">
        <select
          value={filterLocation}
          onChange={(e) => onFilterLocationChange(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
        >
          <option value="">All Locations</option>
          {locations.map((location) => (
            <option key={location._id} value={location.name}>
              {location.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
