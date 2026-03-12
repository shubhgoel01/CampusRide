import React from "react";
import { useNewBookingFlow } from "../hooks/useNewBookingFlow";
import BookingLocationFields from "../components/booking/BookingLocationFields";
import {
  AvailableCyclePanel,
  ActiveBookingPanel,
  ReturnedBookingPanel,
} from "../components/booking/BookingStatePanels";

export default function NewBooking() {
  const {
    locations,
    start,
    end,
    isRoundTrip,
    cycle,
    error,
    foundMessage,
    isSearching,
    isCreating,
    activeBooking,
    returnedBooking,
    setStart,
    setEnd,
    setIsRoundTrip,
    handleFindCycle,
    handleCreate,
  } = useNewBookingFlow();

  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Create Booking</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}

      <BookingLocationFields
        locations={locations}
        start={start}
        end={end}
        onStartChange={setStart}
        onEndChange={setEnd}
      />

      <label className="block mt-3">
        <input
          type="checkbox"
          checked={isRoundTrip}
          onChange={(e) => setIsRoundTrip(e.target.checked)}
        />{" "}
        <span className="ml-2">Round trip</span>
      </label>

      <div className="mt-4 flex space-x-2">
        <button
          disabled={isSearching}
          onClick={handleFindCycle}
          className="bg-indigo-600 text-white px-3 py-1 rounded disabled:opacity-50"
        >
          {isSearching ? "Searching..." : "Find Cycle"}
        </button>
        <button
          disabled={!cycle || isCreating}
          onClick={handleCreate}
          className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
        >
          {isCreating ? "Creating..." : "Create Booking"}
        </button>
      </div>

      {foundMessage && <div className="mt-3 text-green-700">{foundMessage}</div>}

      <AvailableCyclePanel cycle={cycle} />
      <ActiveBookingPanel booking={activeBooking} />
      <ReturnedBookingPanel booking={returnedBooking} />
    </div>
  );
}
