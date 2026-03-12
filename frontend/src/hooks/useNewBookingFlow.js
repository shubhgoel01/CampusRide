import { useEffect, useState } from "react";
import {
  getAvailableCycles,
  createBooking,
  getActiveBookings,
  getReturnedBookings,
} from "../api";
import { isApiSuccess, getApiData } from "../utils/apiResponse";
import { getStoredUser, subscribeUserChanged } from "../utils/sessionAuth";

export function useNewBookingFlow() {
  const [user, setUser] = useState(null);
  const [locations] = useState(["Food Court", "Main Building"]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [cycle, setCycle] = useState(null);
  const [error, setError] = useState("");
  const [foundMessage, setFoundMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  const [returnedBooking, setReturnedBooking] = useState(null);

  useEffect(() => {
    setUser(getStoredUser());

    const onUserChanged = () => {
      setUser(getStoredUser());
    };
    const unsubscribe = subscribeUserChanged(onUserChanged);

    const loadBookings = async () => {
      try {
        const u = getStoredUser();
        if (!u) return;

        try {
          const act = await getActiveBookings({ userId: u._id });
          if (isApiSuccess(act, [200])) {
            const activeData = getApiData(act);
            if (activeData && activeData.length > 0)
              setActiveBooking(activeData[0]);
          }
        } catch (e) {
          console.error(e);
        }

        try {
          const ret = await getReturnedBookings({ userId: u._id });
          if (isApiSuccess(ret, [200])) {
            const returnedData = getApiData(ret);
            if (returnedData && returnedData.length > 0)
              setReturnedBooking(returnedData[0]);
          }
        } catch (e) {
          console.error(e);
        }
      } catch (e) {
        console.error(e);
      }
    };

    loadBookings();
    return () => unsubscribe();
  }, []);

  const handleFindCycle = async () => {
    setError("");
    setFoundMessage("");
    setCycle(null);
    setActiveBooking(null);

    if (returnedBooking) {
      setError(
        "You have a returned booking awaiting verification. Cannot find or create new booking.",
      );
      return;
    }
    if (!start || !end) {
      setError("Select start and end");
      return;
    }
    if (start === end) {
      setError("Start and end cannot be the same");
      return;
    }

    setIsSearching(true);
    try {
      const lcStart = String(start).trim().toLowerCase();
      const res = await getAvailableCycles({ location: lcStart });

      if (isApiSuccess(res, [200])) {
        const data = getApiData(res);
        const found = Array.isArray(data) ? data[0] : data;
        if (found) {
          setCycle(found);
          setFoundMessage("Cycle available, book fast");
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "No cycles available";
      setError(msg);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreate = async () => {
    setError("");
    setFoundMessage("");
    if (returnedBooking) {
      setError(
        "You have a returned booking awaiting verification. Cannot create a new booking.",
      );
      return;
    }

    setIsCreating(true);
    try {
      const lcStart = String(start).trim().toLowerCase();
      const avail = await getAvailableCycles({ location: lcStart });

      if (!isApiSuccess(avail, [200])) {
        setError(
          "No cycles available right now. Showing active booking if any.",
        );
        try {
          const act = await getActiveBookings({ userId: user?._id });
          if (isApiSuccess(act, [200])) {
            const activeData = getApiData(act);
            if (activeData && activeData.length > 0)
              setActiveBooking(activeData[0]);
          }
        } catch (e) {
          console.error(e);
        }
        return;
      }

      const availData = getApiData(avail);
      const cycleToBook = Array.isArray(availData) ? availData[0] : availData;
      if (!cycleToBook) {
        setError("No cycles available");
        return;
      }

      const payload = {
        cycleId: cycleToBook._id,
        isRoundTrip,
        location: [
          String(start).trim().toLowerCase(),
          String(end).trim().toLowerCase(),
        ],
      };

      const res = await createBooking(payload);
      if (isApiSuccess(res, [201])) {
        alert("Booking created");
        window.location.href = "/home";
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to create booking";
      setError(msg);
      try {
        const act = await getActiveBookings({ userId: user?._id });
        if (isApiSuccess(act, [200])) {
          const activeData = getApiData(act);
          if (activeData && activeData.length > 0)
            setActiveBooking(activeData[0]);
        }

        const ret = await getReturnedBookings({ userId: user?._id });
        if (isApiSuccess(ret, [200])) {
          const returnedData = getApiData(ret);
          if (returnedData && returnedData.length > 0) {
            setReturnedBooking(returnedData[0]);
          }
        }
      } catch (e) {
        console.error(e);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return {
    locations,
    start,
    end,
    isRoundTrip,
    cycle,
    error,
    foundMessage,
    isSearching,
    isCreating,
    activeBooking,
    returnedBooking,
    setStart,
    setEnd,
    setIsRoundTrip,
    handleFindCycle,
    handleCreate,
  };
}
