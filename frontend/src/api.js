import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:4000/v1',
  // keep cookies for refresh flow, but prefer per-tab Authorization header from sessionStorage
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Helper to set Authorization header per-tab from sessionStorage
const setAuthHeaderFromSession = () => {
  try {
    const token = sessionStorage.getItem('accessToken')
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    else delete api.defaults.headers.common['Authorization']
  } catch (e) { delete api.defaults.headers.common['Authorization'] }
}

// Initialize header for the current tab
setAuthHeaderFromSession()

// Ensure every request uses the latest token stored in sessionStorage for this tab
api.interceptors.request.use((config) => {
  try {
    const token = sessionStorage.getItem('accessToken')
    if (token) config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` }
  } catch (e) { }
  return config
}, (err) => Promise.reject(err))

// Auth
export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const refresh = () => api.post('/auth/refresh')
export const logout = (userId) => api.post(`/auth/${userId}/logout`)

// User
export const getUser = (userId_userName) => api.get('/user', { params: { userId_userName } })
export const getAllUsers = () => api.get('/user/all')
export const updateUser = (userId, data) => api.patch(`/user/${userId}`, data)
export const deleteUser = (userId) => api.delete(`/user/${userId}`)

// Booking
export const createBooking = (payload) => api.post('/booking', payload)
export const getActiveBookings = (params) => api.get('/booking/active', { params })
export const endBooking = (bookingId) => api.patch(`/booking/${bookingId}/end`)
export const cancelBooking = (bookingId) => api.patch(`/booking/${bookingId}/cancel`)
export const getBookings = (params) => api.get('/booking', { params })
export const getReturnedBookings = (params) => api.get('/booking/returned', { params })
export const getAdminBookings = (params) => api.get('/booking/admin', { params })
export const getStuckBookings = (params) => api.get('/booking/stuck', { params })

// Cycle
export const getAvailableCycles = (params) => api.get('/cycle/available', { params })
export const getCycles = (params) => api.get('/cycle', { params })
export const addCycle = (data) => api.post('/cycle', data)
export const deleteCycle = (cycleId) => api.delete(`/cycle/${cycleId}`)

// Penalty
export const settlePenalty = (userId, data) => api.patch(`/user/penalty/${userId}`, data)

// Location
export const addLocation = (data) => api.post('/location', data)
export const getLocations = () => api.get('/location')
export const getLocation = (locationId) => api.get(`/location/${locationId}`)
export const deleteLocation = (locationId) => api.delete(`/location/${locationId}`)

// Stripe / Transactions
export const createPaymentIntent = (bookingId, data) => api.post(`/stripe/${bookingId}/transaction`, data)
export const verifyTransaction = (bookingId, data) => api.post(`/stripe/${bookingId}/transaction/verify`, data)
export const getTransactions = (params) => api.get('/transaction', { params })

export default api
