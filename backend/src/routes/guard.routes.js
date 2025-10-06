import express from "express";
import { markCycleReceivedController } from "../controllers/guard.controllers.js";
import { getReturnedBookingsController } from "../controllers/booking.controllers.js";
import verifyUser from "../middlewares/auth.middleware.js";
import { verifyGuard } from "../middlewares/accessControl.middleware.js";

const router = express.Router();

// Apply authentication middleware to all guard routes
router.use(verifyUser);

// Apply guard verification middleware to all guard routes
router.use(verifyGuard);

// PATCH - Mark cycle as received by guard
router.patch("/mark-received/:bookingId", markCycleReceivedController);

// GET - Get all returned bookings
router.get("/returned-bookings", getReturnedBookingsController);

export default router;
