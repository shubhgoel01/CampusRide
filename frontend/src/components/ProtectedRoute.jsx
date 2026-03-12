import React from "react";
import { Navigate } from "react-router-dom";
import { getAccessToken, getStoredUser } from "../utils/sessionAuth";

// ProtectedRoute wraps routes that require authentication and optional role checks.
// Props:
// - children: react node
// - allowedRoles: array of allowed userType strings (e.g. ['admin','guard'])
export default function ProtectedRoute({ children, allowedRoles }) {
  try {
    const token = getAccessToken();
    const user = getStoredUser();
    if (!token || !user) return <Navigate to="/login" replace />;
    if (
      allowedRoles &&
      Array.isArray(allowedRoles) &&
      allowedRoles.length > 0
    ) {
      if (!allowedRoles.includes(user.userType)) {
        // unauthorized for this role
        return <Navigate to="/unauthorized" replace />;
      }
    }
    return children;
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
}
