import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [bookingStep, setBookingStep] = useState(1);

  const [showActiveModal, setShowActiveModal] = useState(false);
  const [selectedActiveBooking, setSelectedActiveBooking] = useState(null);
  const [showReturnedModal, setShowReturnedModal] = useState(false);
  const [selectedReturnedBooking, setSelectedReturnedBooking] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [notice, setNotice] = useState(null);

  const showNotice = useCallback((type, message) => {
    setNotice({ type, message });
  }, []);

  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const getCoords = useCallback((location) => {
    if (!location) return null;

    if (
      typeof location.longitude === "number" &&
      typeof location.latitude === "number"
    ) {
      return [location.latitude, location.longitude];
    }

    const geo = location.coordinates;
    if (
      geo?.coordinates &&
      Array.isArray(geo.coordinates) &&
      geo.coordinates.length >= 2
    ) {
      return [Number(geo.coordinates[1]), Number(geo.coordinates[0])];
    }

    return null;
  }, []);

  const rideEstimate = useMemo(() => {
    if (!startLoc || !endLoc) {
      return "Select pickup and drop locations to view a ride estimate.";
    }

    const start = locationsList.find((l) => (l.name || l._id) === startLoc);
    const end = locationsList.find((l) => (l.name || l._id) === endLoc);

    const startCoords = getCoords(start);
    const endCoords = getCoords(end);

    if (!startCoords || !endCoords) {
      return "Estimate unavailable for selected stations.";
    }

    const [lat1, lon1] = startCoords;
    const [lat2, lon2] = endCoords;

    const toRad = (deg) => (deg * Math.PI) / 180;
    const earthKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = earthKm * c;

    const avgSpeedKmph = 14;
    const minutes = Math.max(3, Math.round((distanceKm / avgSpeedKmph) * 60));
    return `Estimated ride time: ${minutes} min (${distanceKm.toFixed(1)} km).`;
  }, [startLoc, endLoc, locationsList, getCoords]);

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
    if (!user) {
      showNotice("error", "No user loaded");
      return;
    }
    if (!user.penaltyAmount || user.penaltyAmount <= 0) {
      showNotice("info", "No penalty to pay");
      return;
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
        showNotice("success", "Booking ended. Waiting for guard verification.");
        await reloadBookings(user?._id);
      }
    } catch (err) {
      showNotice(
        "error",
        err?.response?.data?.message || "Failed to end booking",
      );
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!bookingId) return;
    try {
      const res = await cancelBooking(bookingId);
      if (isApiSuccess(res, [200])) {
        showNotice("success", "Booking cancelled");
        await reloadBookings(user?._id);
      }
    } catch (err) {
      showNotice(
        "error",
        err?.response?.data?.message || "Failed to cancel booking",
      );
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
        if (c) {
          setFoundCycle(c);
          return true;
        }
        setError("No cycles available nearby");
      }
      return false;
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to find cycles");
      return false;
    } finally {
      setIsSearching(false);
    }
  };

  const handleGoToAvailabilityStep = () => {
    setError("");
    if (!startLoc || !endLoc) {
      setError("Please select pickup and drop locations");
      return;
    }
    if (startLoc === endLoc) {
      setError("Pickup and drop cannot be the same");
      return;
    }
    setBookingStep(2);
  };

  const handleCheckAvailabilityStep = async () => {
    const hasCycle = await handleFindCycle();
    if (hasCycle) {
      setBookingStep(3);
      showNotice(
        "success",
        "Cycle available. Review estimate and finalize your booking.",
      );
    }
  };

  const handleBackBookingStep = () => {
    setError("");
    if (bookingStep <= 1) return;
    setBookingStep((prev) => prev - 1);
  };

  const handleStartLocChange = (value) => {
    setStartLoc(value);
    setFoundCycle(null);
    if (bookingStep > 1) setBookingStep(1);
  };

  const handleEndLocChange = (value) => {
    setEndLoc(value);
    setFoundCycle(null);
    if (bookingStep > 1) setBookingStep(1);
  };

  const handleCreateBooking = async () => {
    setError("");
    setIsCreating(true);
    try {
      if (user && user.penaltyAmount && Number(user.penaltyAmount) > 0) {
        showNotice(
          "error",
          "You have an outstanding penalty. Please pay it before creating a new booking.",
        );
        return;
      }
      if (
        (activeBookings && activeBookings.length > 0) ||
        (returnedBookings && returnedBookings.length > 0)
      ) {
        showNotice(
          "error",
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
        showNotice("success", "Booking created");
        setBookingStep(1);
        setFoundCycle(null);
        await loadUserAndBookings();
      } else {
        const msg =
          res?.data?.message || res?.data?.error || "Failed to create booking";
        setError(msg);
        showNotice("error", msg);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to create booking";
      setError(msg);
      showNotice("error", msg);
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
    bookingStep,
    rideEstimate,
    showActiveModal,
    selectedActiveBooking,
    showReturnedModal,
    selectedReturnedBooking,
    elapsedMs,
    notice,
    setStartLoc: handleStartLocChange,
    setEndLoc: handleEndLocChange,
    setShowPaymentBookingId,
    setPaymentAmount,
    showNotice,
    clearNotice,
    handlePayPenalty,
    handleEndBookingById,
    handleCancelBooking,
    openBookingPayment,
    openActiveBooking,
    closeActiveBooking,
    openReturnedBooking,
    closeReturnedBooking,
    handleGoToAvailabilityStep,
    handleCheckAvailabilityStep,
    handleBackBookingStep,
    handleFindCycle,
    handleCreateBooking,
    loadUserAndBookings,
  };
}
