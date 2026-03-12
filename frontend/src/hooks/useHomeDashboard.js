import { useCallback, useEffect, useState } from "react";
import {
  getUser,
  getActiveBookings,
  endBooking,
  cancelBooking,
  getReturnedBookings,
  getAvailableCycles,
  createBooking,
} from "../api";
import { ensureLocationsLoaded } from "../utils/locationCache";
import { isApiSuccess, getApiData } from "../utils/apiResponse";
import { getStoredUser, setStoredUser } from "../utils/sessionAuth";

export function useHomeDashboard() {
  const [user, setUser] = useState(null);
  const [activeBookings, setActiveBookings] = useState([]);
  const [returnedBookings, setReturnedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPaymentBookingId, setShowPaymentBookingId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const [locationsList, setLocationsList] = useState([]);
  const [startLoc, setStartLoc] = useState("");
  const [endLoc, setEndLoc] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [foundCycle, setFoundCycle] = useState(null);

  const [showActiveModal, setShowActiveModal] = useState(false);
  const [selectedActiveBooking, setSelectedActiveBooking] = useState(null);
  const [showReturnedModal, setShowReturnedModal] = useState(false);
  const [selectedReturnedBooking, setSelectedReturnedBooking] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const reloadBookings = useCallback(async (userId) => {
    try {
      const aRes = await getActiveBookings(userId ? { userId } : {});
      setActiveBookings(aRes?.data?.data || []);
      const rRes = await getReturnedBookings(userId ? { userId } : {});
      setReturnedBookings(rRes?.data?.data || []);
    } catch (err) {
      console.error("Failed to load bookings", err);
    }
  }, []);

  const loadUserAndBookings = useCallback(async () => {
    setLoading(true);
    try {
      let currentUser = getStoredUser();

      const uRes = await getUser();
      const fetched = isApiSuccess(uRes, [200])
        ? Array.isArray(getApiData(uRes))
          ? getApiData(uRes)[0]
          : getApiData(uRes)
        : null;

      if (fetched) currentUser = fetched;

      setUser(currentUser);
      if (currentUser) setStoredUser(currentUser);
      await reloadBookings(currentUser?._id);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [reloadBookings]);

  useEffect(() => {
    loadUserAndBookings();
  }, [loadUserAndBookings]);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const list = await ensureLocationsLoaded();
        setLocationsList(list || []);
      } catch (e) {
        console.error("Failed load locations", e);
      }
    };
    loadLocations();
  }, []);

  useEffect(() => {
    const booking =
      activeBookings && activeBookings.length > 0 ? activeBookings[0] : null;
    if (!booking) {
      setElapsedMs(0);
      return;
    }

    const start = booking.startTime
      ? new Date(booking.startTime).getTime()
      : Date.now();
    setElapsedMs(Math.max(0, Date.now() - start));

    const t = setInterval(() => {
      setElapsedMs(Math.max(0, Date.now() - start));
    }, 1000);

    return () => clearInterval(t);
  }, [activeBookings]);

  const handlePayPenalty = () => {
    if (!user) return alert("No user loaded");
    if (!user.penaltyAmount || user.penaltyAmount <= 0) {
      return alert("No penalty to pay");
    }

    const dummyPenaltyId = "000000000000000000000000";
    const penaltyInRupees = user.penaltyAmount / 100;
    setPaymentAmount(penaltyInRupees);
    setShowPaymentBookingId(dummyPenaltyId);
  };

  const handleEndBookingById = async (bookingId) => {
    try {
      const res = await endBooking(bookingId);
      if (isApiSuccess(res, [200])) {
        alert("Booking ended – waiting for guard verification");
        await reloadBookings(user?._id);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to end booking");
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!bookingId) return;
    try {
      const res = await cancelBooking(bookingId);
      if (isApiSuccess(res, [200])) {
        alert("Booking cancelled");
        await reloadBookings(user?._id);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to cancel booking");
    }
  };

  const openBookingPayment = (bookingId, amount) => {
    setPaymentAmount(amount);
    setShowPaymentBookingId(bookingId);
  };

  const openActiveBooking = (b) => {
    setSelectedActiveBooking(b);
    setShowActiveModal(true);
  };

  const closeActiveBooking = () => {
    setSelectedActiveBooking(null);
    setShowActiveModal(false);
  };

  const openReturnedBooking = (b) => {
    setSelectedReturnedBooking(b);
    setShowReturnedModal(true);
  };

  const closeReturnedBooking = () => {
    setSelectedReturnedBooking(null);
    setShowReturnedModal(false);
  };

  const handleFindCycle = async () => {
    setError("");
    setIsSearching(true);
    setFoundCycle(null);
    try {
      if (!startLoc || !endLoc) {
        setError("Please select start and destination");
        return;
      }
      if (startLoc === endLoc) {
        setError("Start and destination cannot be the same");
        return;
      }
      const res = await getAvailableCycles({ location: startLoc });
      if (isApiSuccess(res, [200])) {
        const c = Array.isArray(getApiData(res))
          ? getApiData(res)[0]
          : getApiData(res);
        if (c) setFoundCycle(c);
        else setError("No cycles available nearby");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to find cycles");
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateBooking = async () => {
    setError("");
    setIsCreating(true);
    try {
      if (user && user.penaltyAmount && Number(user.penaltyAmount) > 0) {
        alert(
          "You have an outstanding penalty. Please pay it before creating a new booking.",
        );
        return;
      }
      if (
        (activeBookings && activeBookings.length > 0) ||
        (returnedBookings && returnedBookings.length > 0)
      ) {
        alert(
          "You already have an active or recently returned booking. Please resolve it before creating a new booking.",
        );
        return;
      }
      if (!foundCycle) {
        setError("No cycle selected/found");
        return;
      }

      const payload = {
        cycleId: foundCycle._id,
        isRoundTrip: false,
        location: [String(startLoc).trim(), String(endLoc).trim()],
      };
      const res = await createBooking(payload);
      if (isApiSuccess(res, [201])) {
        alert("Booking created");
        await loadUserAndBookings();
      } else {
        const msg =
          res?.data?.message || res?.data?.error || "Failed to create booking";
        setError(msg);
        alert(msg);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create booking");
    } finally {
      setIsCreating(false);
    }
  };

  return {
    user,
    activeBookings,
    returnedBookings,
    loading,
    error,
    showPaymentBookingId,
    paymentAmount,
    locationsList,
    startLoc,
    endLoc,
    isSearching,
    isCreating,
    foundCycle,
    showActiveModal,
    selectedActiveBooking,
    showReturnedModal,
    selectedReturnedBooking,
    elapsedMs,
    setStartLoc,
    setEndLoc,
    setShowPaymentBookingId,
    setPaymentAmount,
    handlePayPenalty,
    handleEndBookingById,
    handleCancelBooking,
    openBookingPayment,
    openActiveBooking,
    closeActiveBooking,
    openReturnedBooking,
    closeReturnedBooking,
    handleFindCycle,
    handleCreateBooking,
    loadUserAndBookings,
  };
}
