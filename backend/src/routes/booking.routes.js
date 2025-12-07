import express from "express"
import { endBookingController, createBookingController, cancelBookingController, getBookings_merged, getActiveBookings, getReturnedBookingsController, getStuckBookings, getAdminBookings } from "../controllers/booking.controllers.js"
import verifyUser from "../middlewares/auth.middleware.js"
import { endBookingHandler, newBookingHandler} from "../middlewares/booking.middleware.js"
import getDistanceAndTime from "../middlewares/map.middleware.js"
import { geoCoding } from "../middlewares/location.middleware.js"
import { verifyAdmin } from "../middlewares/accessControl.middleware.js"

const bookingRouter = express.Router()

bookingRouter.route("/").post(verifyUser, newBookingHandler, geoCoding, getDistanceAndTime ,createBookingController)
bookingRouter.route("/:bookingId/cancel").patch(verifyUser, cancelBookingController)
bookingRouter.route("/:bookingId/end").patch(verifyUser, endBookingHandler, endBookingController)

bookingRouter.route("/").get(verifyUser, geoCoding, getBookings_merged)

bookingRouter.route("/active").get(verifyUser, geoCoding, getActiveBookings)
bookingRouter.route("/returned").get(verifyUser, geoCoding, getReturnedBookingsController)

// Admin-only: stuck bookings
bookingRouter.route("/stuck").get(verifyUser, verifyAdmin, geoCoding, getStuckBookings)

// Admin-only: bookings with populated user & cycle info
bookingRouter.route("/admin").get(verifyUser, verifyAdmin, geoCoding, getAdminBookings)

export {bookingRouter}
