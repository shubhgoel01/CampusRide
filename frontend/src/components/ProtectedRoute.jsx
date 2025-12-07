import React from 'react'
import { Navigate } from 'react-router-dom'

// ProtectedRoute wraps routes that require authentication and optional role checks.
// Props:
// - children: react node
// - allowedRoles: array of allowed userType strings (e.g. ['admin','guard'])
export default function ProtectedRoute({ children, allowedRoles }){
  try{
    const token = sessionStorage.getItem('accessToken')
    const raw = sessionStorage.getItem('user')
    if(!token || !raw) return <Navigate to="/login" replace />
    const user = JSON.parse(raw)
    if(allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length>0){
      if(!allowedRoles.includes(user.userType)){
        // unauthorized for this role
        return <Navigate to="/unauthorized" replace />
      }
    }
    return children
  }catch(e){
    return <Navigate to="/login" replace />
  }
}
