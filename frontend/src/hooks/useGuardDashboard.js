import { useEffect, useMemo, useState } from "react";
import api, { getReturnedBookings } from "../api";
import { ensureLocationsLoaded, formatLocation } from "../utils/locationCache";
import { isApiSuccess } from "../utils/apiResponse";

export function useGuardDashboard() {
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterLocation, setFilterLocation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusNotice, setStatusNotice] = useState(null);

  const clearStatusNotice = () => setStatusNotice(null);

  const loadLocations = async () => {
    try {
      const list = await ensureLocationsLoaded();
      setLocations(list || []);
    } catch (e) {
      console.error("Failed to load locations", e);
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await getReturnedBookings({});
      setItems(res?.data?.data || []);
    } catch (e) {
      console.error("Failed to load bookings", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
    loadBookings();
  }, []);

  const handleMarkReceived = async (bookingId) => {
    if (!confirm("Confirm: Mark this cycle as physically received/verified?")) {
      return;
    }
    try {
      const res = await api.patch(`/guard/mark-received/${bookingId}`);
      if (isApiSuccess(res, [200])) {
        setStatusNotice({
          type: "success",
          message: "Cycle marked as received successfully.",
        });
        loadBookings();
      }
    } catch (e) {
      setStatusNotice({
        type: "error",
        message: e?.response?.data?.message || "Failed to update booking.",
      });
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterLocation) {
        const endName =
          item.endLocationName || formatLocation(item.endLocation);
        if (
          !endName.toLowerCase().includes(filterLocation.toLowerCase()) &&
          !String(item.endLocation?.coordinates).includes(filterLocation)
        ) {
          return false;
        }
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const user = item.user?.fullName || item.user?.userName || "";
        const cycle = item.cycle?.cycleName || "";
        return (
          user.toLowerCase().includes(query) ||
          cycle.toLowerCase().includes(query) ||
          item._id.includes(query)
        );
      }

      return true;
    });
  }, [filterLocation, items, searchQuery]);

  return {
    locations,
    loading,
    statusNotice,
    filterLocation,
    searchQuery,
    filteredItems,
    setFilterLocation,
    setSearchQuery,
    clearStatusNotice,
    loadBookings,
    handleMarkReceived,
  };
}
