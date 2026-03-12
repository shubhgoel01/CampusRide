import React from "react";

export default function HomeBookingForm({
  disabled,
  disabledReason,
  locations,
  startLoc,
  endLoc,
  bookingStep,
  rideEstimate,
  isSearching,
  isCreating,
  error,
  foundCycle,
  onStartChange,
  onEndChange,
  onStepContinue,
  onCheckAvailability,
  onFinalize,
  onStepBack,
}) {
  const StepBullet = ({ step, label }) => {
    const isDone = bookingStep > step;
    const isActive = bookingStep === step;

    return (
      <div className="flex items-center gap-3">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${isDone || isActive ? "bg-primary text-white border-primary" : "bg-white text-slate-500 border-slate-300"}`}
        >
          {step}
        </div>
        <span
          className={`${isActive ? "text-slate-900 font-semibold" : "text-slate-500"}`}
        >
          {label}
        </span>
      </div>
    );
  };

  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1 transition-opacity ${disabled ? "opacity-50 pointer-events-none grayscale-[0.5]" : ""}`}
    >
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-primary rounded-full"></span>
        Rent a Cycle
      </h2>

      {disabled && disabledReason && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {disabledReason}
        </div>
      )}

      <div className="space-y-2 pb-4 mb-4 border-b border-slate-100">
        <StepBullet step={1} label="Select pickup and drop" />
        <StepBullet step={2} label="Confirm availability and estimate" />
        <StepBullet step={3} label="Finalize booking" />
      </div>

      <div className="space-y-4">
        {bookingStep === 1 && (
          <>
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

            <button
              onClick={onStepContinue}
              disabled={disabled}
              className="w-full btn-primary justify-center py-3 text-base shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Continue to Availability
            </button>
          </>
        )}

        {bookingStep === 2 && (
          <>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 space-y-1">
              <div>
                <span className="font-semibold">Pickup:</span> {startLoc || "-"}
              </div>
              <div>
                <span className="font-semibold">Drop:</span> {endLoc || "-"}
              </div>
              <div className="text-slate-600">{rideEstimate}</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onStepBack}
                className="flex-1 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
              >
                Back
              </button>
              <button
                onClick={onCheckAvailability}
                disabled={isSearching || disabled}
                className="flex-1 btn-primary justify-center py-3 text-base shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSearching ? "Checking..." : "Check Availability"}
              </button>
            </div>
          </>
        )}

        {bookingStep === 3 && (
          <>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 space-y-1">
              <div>
                <span className="font-semibold">Pickup:</span> {startLoc || "-"}
              </div>
              <div>
                <span className="font-semibold">Drop:</span> {endLoc || "-"}
              </div>
              <div className="text-slate-600">{rideEstimate}</div>
            </div>

            {foundCycle && (
              <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <div>
                  <div className="text-sm font-semibold text-green-800">
                    {foundCycle.cycleName || "Cycle Available"}
                  </div>
                  <div className="text-xs text-green-600">
                    Cycle is ready to book
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={onStepBack}
                className="flex-1 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
              >
                Back
              </button>
              <button
                onClick={onFinalize}
                disabled={isCreating || disabled || !foundCycle}
                className="flex-1 btn-primary justify-center py-3 text-base shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isCreating ? "Finalizing..." : "Finalize Booking"}
              </button>
            </div>
          </>
        )}

        <div className="min-h-[2rem]">
          {isSearching && (
            <div className="text-sm text-primary animate-pulse">
              Searching for available cycles...
            </div>
          )}
          {!isSearching && error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
