import React from "react";
import { formatCountdownFromDate } from "../../utils/uiFormatters";

export function AvailableCyclePanel({ cycle }) {
  if (!cycle) return null;

  return (
    <div className="mt-4 p-3 border rounded">
      <div>
        <strong>Cycle:</strong> {cycle.cycleName || "-"}
      </div>
      <div>
        <strong>Status:</strong> {cycle.status}
      </div>
    </div>
  );
}

export function ActiveBookingPanel({ booking }) {
  if (!booking) return null;

  return (
    <div className="mt-4 p-3 border rounded bg-yellow-50">
      <div className="font-semibold">Booking in progress</div>
      <div>Start: {String(booking.startTime)}</div>
      <div>Estimated end: {String(booking.estimatedEndTime)}</div>
      <div>
        Time remaining: {formatCountdownFromDate(booking.estimatedEndTime)}
      </div>
    </div>
  );
}

export function ReturnedBookingPanel({ booking }) {
  if (!booking) return null;

  return (
    <div className="mt-4 p-3 border rounded bg-yellow-50">
      <div className="font-semibold">
        Booking returned - awaiting verification
      </div>
      <div>Status: {booking.status}</div>
      <div>Penalty Amount: {booking.penaltyAmount || 0}</div>
      <div>Start: {String(booking.startTime)}</div>
      <div>Returned At: {String(booking.actualEndTime)}</div>
      <div className="mt-2 text-sm text-yellow-700">
        You cannot create a new booking while one booking is awaiting guard
        verification.
      </div>
    </div>
  );
}
