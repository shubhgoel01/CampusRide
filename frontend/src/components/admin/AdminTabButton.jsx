import React from "react";

export default function AdminTabButton({ active, onClick, children, icon }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 font-medium text-sm rounded-lg border whitespace-nowrap transition-all ${
        active
          ? "bg-primary text-white border-primary shadow-sm"
          : "text-slate-600 border-transparent hover:bg-slate-100"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
