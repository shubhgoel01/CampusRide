import React from "react";

const styles = {
  active: "bg-green-100 text-green-700 border-green-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
  returned: "bg-yellow-100 text-yellow-700 border-yellow-200",
  canceled: "bg-red-100 text-red-700 border-red-200",
  pending: "bg-orange-100 text-orange-700 border-orange-200",
  admin: "bg-purple-100 text-purple-700 border-purple-200",
  user: "bg-slate-100 text-slate-700 border-slate-200",
  guard: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

export default function StatusBadge({ status }) {
  const s = String(status).toLowerCase();
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
        styles[s] || styles.user
      } capitalize`}
    >
      {status}
    </span>
  );
}
