import React from "react";
import { useGuardDashboard } from "../hooks/useGuardDashboard";
import GuardFilters from "../components/guard/GuardFilters";
import GuardReturnsTable from "../components/guard/GuardReturnsTable";

export default function Guard() {
  const {
    locations,
    loading,
    filterLocation,
    searchQuery,
    filteredItems,
    setFilterLocation,
    setSearchQuery,
    loadBookings,
    handleMarkReceived,
  } = useGuardDashboard();

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Station Guard Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Verify returned cycles and manage station inventory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadBookings}
            className="p-2 text-slate-500 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors"
            title="Refresh"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      <GuardFilters
        locations={locations}
        filterLocation={filterLocation}
        searchQuery={searchQuery}
        onFilterLocationChange={setFilterLocation}
        onSearchQueryChange={setSearchQuery}
      />

      <GuardReturnsTable
        loading={loading}
        items={filteredItems}
        onMarkReceived={handleMarkReceived}
      />
    </div>
  );
}
