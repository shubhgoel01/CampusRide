import { useEffect, useState } from "react";
import {
  getAllUsers,
  getTransactions,
  getAdminBookings,
  getActiveBookings,
  getLocations,
  getStuckBookings,
  deleteUser,
} from "../api";
import { setCachedLocations } from "../utils/locationCache";

export function useAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState({
    users: 0,
    active: 0,
    totalRides: 0,
    issues: 0,
  });
  const [ridesFilter, setRidesFilter] = useState("all");
  const [usersList, setUsersList] = useState([]);
  const [activeBookingsList, setActiveBookingsList] = useState([]);
  const [stuckList, setStuckList] = useState([]);
  const [allBookingsList, setAllBookingsList] = useState([]);
  const [transactionsList, setTransactionsList] = useState([]);
  const [locations, setLocations] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalBooking, setModalBooking] = useState(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [statusNotice, setStatusNotice] = useState(null);

  const clearStatusNotice = () => setStatusNotice(null);
  const pushStatusNotice = (type, message) =>
    setStatusNotice({ type, message });

  const loadStats = async () => {
    try {
      const [u, a, t, all] = await Promise.all([
        getAllUsers(),
        getActiveBookings({}),
        getTransactions(),
        getAdminBookings(),
      ]);

      const users = u?.data?.data?.length || 0;
      const active = a?.data?.data?.length || 0;
      const allBookings = all?.data?.data || [];
      const issues = allBookings.filter(
        (b) =>
          (b.status === "pending" &&
            Date.now() - new Date(b.startTime).getTime() > 4 * 3600 * 1000) ||
          b.penaltyAmount > 500,
      ).length;

      setStats((prev) => ({ ...prev, users, active, issues }));
      setUsersList(u?.data?.data || []);
      setActiveBookingsList(a?.data?.data || []);
      setAllBookingsList(allBookings);
      setTransactionsList(t?.data?.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await loadStats();

    try {
      const sRes = await getStuckBookings({ minutes: 30 });
      setStuckList(sRes?.data?.data || []);
    } catch (e) {
      console.error(e);
    }

    try {
      const loc = await getLocations();
      const locData = loc?.data?.data || [];
      setLocations(locData);
      setCachedLocations(locData);
    } catch (e) {
      console.error("Load Error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!allBookingsList) return;

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const weekStart = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const monthStart = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    const count = allBookingsList.filter((b) => {
      const t = new Date(b.startTime).getTime();
      if (ridesFilter === "today") return t >= todayStart;
      if (ridesFilter === "week") return t >= weekStart;
      if (ridesFilter === "month") return t >= monthStart;
      return true;
    }).length;

    setStats((prev) => ({ ...prev, totalRides: count }));
  }, [ridesFilter, allBookingsList]);

  const handleRemoveUser = async (uId) => {
    if (
      !confirm(
        "Are you sure you want to remove this user? THIS CANNOT BE UNDONE.",
      )
    ) {
      return;
    }
    try {
      await deleteUser(uId);
      setStatusNotice({
        type: "success",
        message: "User removed successfully.",
      });
      loadData();
      setUserModalOpen(false);
    } catch (e) {
      setStatusNotice({ type: "error", message: "Failed to remove user." });
    }
  };

  return {
    loading,
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
    statusNotice,
    userModalOpen,
    selectedUser,
    setTab,
    setRidesFilter,
    setModalOpen,
    setModalBooking,
    setUserModalOpen,
    setSelectedUser,
    clearStatusNotice,
    pushStatusNotice,
    handleRemoveUser,
  };
}
