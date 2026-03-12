export const isApiSuccess = (response, expectedStatuses = []) => {
  const success = response?.data?.success;
  const statusCode = response?.data?.statusCode;

  if (success === true) return true;

  if (typeof statusCode === "number") {
    if (Array.isArray(expectedStatuses) && expectedStatuses.length > 0) {
      return expectedStatuses.includes(statusCode);
    }
    return statusCode >= 200 && statusCode < 300;
  }

  return false;
};

export const getApiData = (response) => response?.data?.data;
