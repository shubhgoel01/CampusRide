export const getStoredUser = () => {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (!user) return;
  sessionStorage.setItem("user", JSON.stringify(user));
};

export const getAccessToken = () => {
  try {
    return sessionStorage.getItem("accessToken");
  } catch (e) {
    return null;
  }
};

export const setAccessToken = (token) => {
  if (!token) return;
  sessionStorage.setItem("accessToken", token);
};

export const clearStoredAuth = () => {
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("accessToken");
};

export const emitUserChanged = () => {
  try {
    window.dispatchEvent(new Event("userChanged"));
  } catch (e) {
    // no-op
  }
};

export const subscribeUserChanged = (handler) => {
  window.addEventListener("userChanged", handler);
  return () => window.removeEventListener("userChanged", handler);
};
