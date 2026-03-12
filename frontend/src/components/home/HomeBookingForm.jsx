import React from "react";

export default function HomeBookingForm({
  disabled,
  locations,
  startLoc,
  endLoc,
  isSearching,
  isCreating,
  error,
  foundCycle,
  onStartChange,
  onEndChange,
  onAction,
}) {
  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1 transition-opacity ${disabled ? "opacity-50 pointer-events-none grayscale-[0.5]" : ""}`}
    >
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-primary rounded-full"></span>
        Rent a Cycle
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">
            Pick-up Location
          </label>
          <select
            disabled={disabled}
            value={startLoc}
            onChange={(e) => onStartChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-primary p-2.5 outline-none transition-all disabled:opacity-50"
          >
            <option value="">Select station...</option>
            {locations.map((l) => (
              <option key={l._id} value={l.name || l._id}>
                {l.name || String(l._id)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">
            Drop-off Location
          </label>
          <select
            disabled={disabled}
            value={endLoc}
            onChange={(e) => onEndChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-primary p-2.5 outline-none transition-all disabled:opacity-50"
          >
            <option value="">Select destination...</option>
            {locations.map((l) => (
              <option key={l._id} value={l.name || l._id}>
                {l.name || String(l._id)}
              </option>
            ))}
          </select>
        </div>

        <div className="min-h-[2rem]">
          {isSearching && (
            <div className="text-sm text-primary animate-pulse">
              Searching for available cycles...
            </div>
          )}
          {!isSearching && foundCycle && (
            <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div>
                <div className="text-sm font-semibold text-green-800">
                  {foundCycle.cycleName || "Cycle Available"}
                </div>
                <div className="text-xs text-green-600">Ready to book</div>
              </div>
            </div>
          )}
          {!isSearching && !foundCycle && error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <button
          onClick={onAction}
          disabled={isSearching || isCreating || disabled}
          className="w-full btn-primary justify-center py-3 text-base shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSearching
            ? "Checking Availability..."
            : foundCycle
              ? isCreating
                ? "Confirm Booking"
                : "Book Now"
              : "Find Cycle"}
        </button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase">
            Or
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <button
          disabled={true}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 font-semibold cursor-not-allowed"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            ></path>
          </svg>
          Scan QR Code (Disabled)
        </button>
      </div>
    </div>
  );
}
