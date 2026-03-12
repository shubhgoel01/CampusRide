import React from "react";

export default function BookingLocationFields({
  locations,
  start,
  end,
  onStartChange,
  onEndChange,
}) {
  return (
    <>
      <label className="block">
        <span className="text-sm text-gray-600">Start Location</span>
        <select
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
          className="w-full border px-2 py-1 rounded mt-1"
        >
          <option value="">Select start</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>

      <label className="block mt-2">
        <span className="text-sm text-gray-600">End Location</span>
        <select
          value={end}
          onChange={(e) => onEndChange(e.target.value)}
          className="w-full border px-2 py-1 rounded mt-1"
        >
          <option value="">Select end</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
