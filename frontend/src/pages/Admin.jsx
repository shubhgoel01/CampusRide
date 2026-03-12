import React, { useCallback } from "react";
import BookingModal from "../components/BookingModal";
import AdminLocations from "./AdminLocations";
import AdminCycles from "./AdminCycles";
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import AdminStatCard from "../components/admin/AdminStatCard";
import AdminTabButton from "../components/admin/AdminTabButton";
import AdminUsersTable from "../components/admin/AdminUsersTable";
import AdminActiveRidesTable from "../components/admin/AdminActiveRidesTable";
import AdminTransactionsTable from "../components/admin/AdminTransactionsTable";
import AdminStuckBookingsTable from "../components/admin/AdminStuckBookingsTable";
import AdminUserDetailsModal from "../components/admin/AdminUserDetailsModal";

const tabs = [
  {
    key: "dashboard",
    label: "Overview",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
  },
  {
    key: "users",
    label: "Users",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  {
    key: "active",
    label: "Live Rides",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    key: "manageCycles",
    label: "Cycles",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M16 10V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v5"
        />
      </svg>
    ),
  },
  {
    key: "locations",
    label: "Locations",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
      </svg>
    ),
  },
  {
    key: "transactions",
    label: "Finance",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

export default function Admin() {
  const {
    tab,
    stats,
    ridesFilter,
    usersList,
    activeBookingsList,
    stuckList,
    transactionsList,
    locations,
    modalOpen,
    modalBooking,
    userModalOpen,
    selectedUser,
    setTab,
    setRidesFilter,
    setModalOpen,
    setModalBooking,
    setUserModalOpen,
    setSelectedUser,
    handleRemoveUser,
  } = useAdminDashboard();

  const openBooking = useCallback(
    (booking) => {
      setModalBooking(booking);
      setModalOpen(true);
    },
    [setModalBooking, setModalOpen],
  );

  const openUser = useCallback(
    (user) => {
      setSelectedUser(user);
      setUserModalOpen(true);
    },
    [setSelectedUser, setUserModalOpen],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Users"
          value={stats.users}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
          color="blue"
        />
        <AdminStatCard
          title="Active Rides"
          value={stats.active}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
          color="green"
          subtext="Current live bookings"
        />
        <AdminStatCard
          title="Total Rides"
          value={stats.totalRides}
          filter={ridesFilter}
          onFilterChange={setRidesFilter}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
          color="indigo"
        />
        <AdminStatCard
          title="Pending Issues"
          value={stats.issues}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          }
          color="red"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2 flex flex-wrap gap-2 sticky top-0 z-10">
        {tabs.map((item) => (
          <AdminTabButton
            key={item.key}
            active={tab === item.key}
            onClick={() => setTab(item.key)}
            icon={item.icon}
          >
            {item.key === "stuck" ? `Stuck (${stuckList.length})` : item.label}
          </AdminTabButton>
        ))}
        <AdminTabButton
          active={tab === "stuck"}
          onClick={() => setTab("stuck")}
          icon={
            <svg
              className="w-4 h-4 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          }
        >
          {`Stuck (${stuckList.length})`}
        </AdminTabButton>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
        {tab === "users" && (
          <AdminUsersTable users={usersList} onViewUser={openUser} />
        )}
        {tab === "active" && (
          <AdminActiveRidesTable
            bookings={activeBookingsList}
            onOpenBooking={openBooking}
          />
        )}
        {tab === "transactions" && (
          <AdminTransactionsTable transactions={transactionsList} />
        )}
        {tab === "stuck" && (
          <AdminStuckBookingsTable
            bookings={stuckList}
            onOpenBooking={openBooking}
          />
        )}
        {tab === "manageCycles" && (
          <div className="p-6">
            <AdminCycles />
          </div>
        )}
        {tab === "locations" && (
          <div className="p-6">
            <AdminLocations />
          </div>
        )}

        {tab === "dashboard" && (
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto py-12">
              <div className="w-24 h-24 bg-slate-50 rounded-full mx-auto mb-4 flex items-center justify-center text-primary/20">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                Dashboard Overview
              </h3>
              <p className="text-slate-500 mt-2">
                Welcome to the centralized admin control panel. Use the
                navigation tabs above to manage users, track live rides, update
                cycles, and view financial reports.
              </p>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <BookingModal
          open={modalOpen}
          booking={modalBooking}
          onClose={() => setModalOpen(false)}
          locations={locations}
        />
      )}

      <AdminUserDetailsModal
        user={selectedUser}
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        onRemove={handleRemoveUser}
      />
    </div>
  );
}
