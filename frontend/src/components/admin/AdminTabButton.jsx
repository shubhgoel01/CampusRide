import React from "react";

export default function AdminTabButton({ active, onClick, children, icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 font-medium text-sm rounded-lg transition-all ${
        active
          ? "bg-primary text-white shadow-md shadow-primary/30"
          : "text-slate-500 hover:bg-slate-100"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
