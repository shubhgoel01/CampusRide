import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }) {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMobileDrawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileDrawerOpen]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        collapsed={isDesktopCollapsed}
        onToggleCollapse={() => setIsDesktopCollapsed((prev) => !prev)}
      />

      <Sidebar
        mobile
        open={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col h-screen">
        <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Open navigation menu"
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-white font-bold flex items-center justify-center text-sm">
              CR
            </div>
            <span className="font-semibold text-slate-800">CampusRide</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
