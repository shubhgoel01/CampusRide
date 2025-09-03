import express from "express"
import { endBookingController, createBookingController, cancelBookingController, getBookings_merged, getActiveBookings, getReturnedBookingsController } from "../controllers/booking.controllers.js"
import verifyUser from "../middlewares/auth.middleware.js"
import { endBookingHandler, newBookingHandler} from "../middlewares/booking.middleware.js"
import getDistanceAndTime from "../middlewares/map.middleware.js"
import { geoCoding } from "../middlewares/location.middleware.js"

const bookingRouter = express.Router()

bookingRouter.route("/").post(verifyUser, newBookingHandler, geoCoding, getDistanceAndTime ,createBookingController)
bookingRouter.route("/:bookingId/cancel").patch(verifyUser, cancelBookingController)
bookingRouter.route("/:bookingId/end").patch(verifyUser, endBookingHandler, endBookingController)

bookingRouter.route("/").get(verifyUser, getBookings_merged)

bookingRouter.route("/active").get(verifyUser, getActiveBookings)
bookingRouter.route("/returned").get(verifyUser, getReturnedBookingsController)

export {bookingRouter}
