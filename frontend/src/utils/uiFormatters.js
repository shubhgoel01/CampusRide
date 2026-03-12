export const formatCurrencyFromPaise = (value) => {
  const amount = Number(value || 0) / 100;
  return `₹${amount.toFixed(2)}`;
};

export const formatClockTime = (dateLike) => {
  if (!dateLike) return "--";
  try {
    return new Date(dateLike).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "--";
  }
};

export const formatDateOnly = (dateLike) => {
  if (!dateLike) return "--";
  try {
    return new Date(dateLike).toLocaleDateString();
  } catch (e) {
    return "--";
  }
};

export const getInitial = (label, fallback = "U") => {
  return label && typeof label === "string" && label.length > 0
    ? label[0]
    : fallback;
};

export const formatCountdownFromDate = (dateLike) => {
  if (!dateLike) return "N/A";
  try {
    const end = new Date(dateLike).getTime();
    const now = Date.now();
    const ms = Math.max(0, end - now);
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  } catch (e) {
    return "N/A";
  }
};

export const formatDurationFromMs = (ms) => {
  if (ms == null || Number.isNaN(ms)) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};
