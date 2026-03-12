import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.utils.js";
import ApiError from "../utils/ApiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import {
  getStuckBookingsService,
  createBookingService,
  cancelBookingService,
  endBookingService,
  getBookingsService,
  getActiveBookingsService,
  getReturnedBookingsService,
  getAdminBookingsService,
} from "../services/booking.service.js";

// GET - Admin: bookings that are pending for more than X minutes (default 30)
const getStuckBookings = asyncHandler(async (req, res) => {
  const minutes = parseInt(req.query.minutes || "30", 10);
  if (isNaN(minutes) || minutes <= 0) {
    throw new ApiError(
      400,
      "Bad Request",
      "minutes must be a positive integer",
    );
  }

  const stuck = await getStuckBookingsService({
    minutes,
    locations: req.locations || [],
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Stuck bookings fetched", stuck));
});

// POST
const createBookingController = asyncHandler(async (req, res) => {
  const loggedInUser = req.user;
  const { cycleId, isRoundTrip } = req.body;
  const { distance, duration, startTime } = req.routeInfo;
  const locationArray = req.locations;

  if (!locationArray || locationArray.length < 2) {
    throw new ApiError(400, "Invalid or missing locations");
  }

  if (!cycleId || !startTime) {
    throw new ApiError(400, "All fields are required");
  }

  const newBooking = await createBookingService({
    userId: loggedInUser._id,
    cycleId,
    isRoundTrip,
    distance,
    duration,
    startTime,
    locations: locationArray,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Booking created successfully", newBooking));
});

// PATCH
const cancelBookingController = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const loggedInUser = req.user;

  if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new ApiError(400, "Bad Request", "Valid Booking ID is required");
  }

  await cancelBookingService({ bookingId, userId: loggedInUser._id });

  return res
    .status(200)
    .json(new ApiResponse(200, "Booking cancelled successfully"));
});

// PATCH
const endBookingController = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const loggedInUser = req.user;
  const { actualEndTime, penaltyApplied } = req.penaltyInfo || {};

  if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new ApiError(400, "Bad Request", "Valid Booking ID is required");
  }

  if (!actualEndTime || penaltyApplied === undefined) {
    throw new ApiError(400, "Bad Request", "Failed To access local time");
  }

  const result = await endBookingService({
    bookingId,
    loggedInUser,
    penaltyInfo: req.penaltyInfo,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Cycle returned successfully. Waiting for guard verification.",
        result,
      ),
    );
});

// GET
const getBookings_merged = asyncHandler(async (req, res) => {
  const { bookingId, cycleId, userId } = req.query;

  const result = await getBookingsService({
    bookingId,
    cycleId,
    userId,
    locations: req.locations || [],
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Bookings fetched successfully", result));
});

// GET
const getActiveBookings = asyncHandler(async (req, res) => {
  const { userId, cycleId } = req.query;

  const result = await getActiveBookingsService({
    userId,
    cycleId,
    locations: req.locations || [],
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Active bookings fetched", result));
});

// GET - Get all returned bookings (for guards to see what needs to be received)
const getReturnedBookingsController = asyncHandler(async (req, res) => {
  const { userId } = req.query;

  const returnedBookings = await getReturnedBookingsService({
    userId,
    locations: req.locations || [],
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Returned bookings fetched successfully",
        returnedBookings,
      ),
    );
});

// ADMIN: Get bookings with populated user and cycle info (for admin dashboard)
const getAdminBookings = asyncHandler(async (req, res) => {
  const { limit } = req.query;

  const bookings = await getAdminBookingsService({
    limit,
    locations: req.locations || [],
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Admin bookings fetched", bookings));
});

export {
  createBookingController,
  endBookingController,
  getBookings_merged,
  getActiveBookings,
  cancelBookingController,
  getReturnedBookingsController,
  getStuckBookings,
  getAdminBookings,
};
