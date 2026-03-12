import React from "react";

const toneMap = {
  success: {
    container: "bg-emerald-50 border-emerald-200 text-emerald-800",
    icon: "text-emerald-600",
  },
  error: {
    container: "bg-red-50 border-red-200 text-red-800",
    icon: "text-red-600",
  },
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-800",
    icon: "text-blue-600",
  },
};

export default function StatusBanner({ notice, onClose }) {
  if (!notice?.message) return null;

  const tone = toneMap[notice.type] || toneMap.info;

  return (
    <div
      role="status"
      className={`rounded-xl border px-4 py-3 text-sm flex items-start justify-between gap-3 ${tone.container}`}
    >
      <div className="flex items-start gap-2">
        <svg
          className={`w-5 h-5 mt-0.5 ${tone.icon}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="leading-relaxed">{notice.message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-xs font-semibold opacity-80 hover:opacity-100"
      >
        Dismiss
      </button>
    </div>
  );
}
