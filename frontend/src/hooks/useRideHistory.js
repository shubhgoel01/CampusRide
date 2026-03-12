import { useEffect, useMemo, useState } from "react";
import { getBookings } from "../api";
import { ensureLocationsLoaded } from "../utils/locationCache";
import { getStoredUser } from "../utils/sessionAuth";

export function useRideHistory() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const user = getStoredUser();
        if (!user) {
          return;
        }

        await ensureLocationsLoaded();
        const res = await getBookings({ userId: user._id });
        const sorted = (res?.data?.data || []).sort(
          (a, b) => new Date(b.startTime) - new Date(a.startTime),
        );
        setBookings(sorted);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => {
    const total = bookings.length;
    const active = bookings.filter(
      (booking) => booking.status === "pending",
    ).length;
    const penalties =
      bookings.reduce(
        (accumulator, booking) => accumulator + (booking.penaltyAmount || 0),
        0,
      ) / 100;
    return { total, active, penalties };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (filter === "active") {
      return bookings.filter((booking) => booking.status === "pending");
    }
    if (filter === "completed") {
      return bookings.filter(
        (booking) =>
          booking.status === "returned" || booking.status === "completed",
      );
    }
    return bookings;
  }, [bookings, filter]);

  return {
    loading,
    filter,
    stats,
    filteredBookings,
    selectedBooking,
    setFilter,
    setSelectedBooking,
  };
}
