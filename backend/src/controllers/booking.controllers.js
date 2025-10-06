// createBooking, {updateBooking}, cancelBooking, endBooking
// getBookingById (to show current booking) , getAllBookingsByCycleId (to show booking history of cycle) , getAllBookingsByUserId (to show booking history of user), getAllBookingsByEndLocation (to show history of end location bookings)
//Get activeBookingByCycleId, getActiveBookingByUserId (to show current booking of user), getActiveBookingsByEndLocation (to show current booking of end location)

import asyncHandler from "../utils/asyncHandler.utils.js";
import ApiError from "../utils/ApiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import mongoose from "mongoose";
import { Booking } from "../models/booking.model.js";
import { Cycle } from "../models/cycle.models.js";
import { User } from "../models/user.models.js";

// GET - Admin: bookings that are pending for more than X minutes (default 30)
const getStuckBookings = asyncHandler(async (req, res) => {
  const minutes = parseInt(req.query.minutes || '30', 10);
  if (isNaN(minutes) || minutes <= 0) {
    throw new ApiError(400, 'Bad Request', 'minutes must be a positive integer');
  }

  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  const locations = req.locations || [];

  const matchQuery = {
    status: 'pending',
    startTime: { $lte: cutoff }
  };

  if (locations.length > 0) {
    // match by endLocation coordinates if a location filter was provided
    matchQuery['endLocation.coordinates'] = locations[0].coordinates.coordinates;
  }

  const stuck = await Booking.aggregate([
    { $match: matchQuery },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'cycles',
        localField: 'cycleId',
        foreignField: '_id',
        as: 'cycle'
      }
    },
    { $unwind: { path: '$cycle', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        startTime: 1,
        userId: 1,
        cycleId: 1,
        status: 1,
        'user.userName': 1,
        'user.fullName': 1,
        'cycle.cycleNumber': 1,
        'cycle.model': 1,
        endLocation: 1,
        createdAt: 1,
        updatedAt: 1
      }
    },
    { $sort: { startTime: -1 } }
  ]);

  return res.status(200).json(new ApiResponse(200, 'Stuck bookings fetched', stuck));
});

// POST
const createBookingController = asyncHandler(async (req, res) => {
  const loggedInUser = req.user;
  const { cycleId, isRoundTrip } = req.body;
  const { distance, duration, startTime } = req.routeInfo;
  const locationArray = req.locations

  console.log(String(locationArray))
  console.log(locationArray)


  if (!locationArray || locationArray.length < 2)
    throw new ApiError(400, "Invalid or missing locations");

  if (!cycleId || !startTime)
    throw new ApiError(400, "All fields are required");

  const cycle = await Cycle.findOneAndUpdate(
    { _id: cycleId, status: "available" },
    { status: "booked" },
    { new: true }
  );

  if (!cycle)
    throw new ApiError(400, "Cycle not found or already booked");

  const extraMinutes = isRoundTrip ? 10 : 5;
  const estimatedEndTime = new Date(
    startTime.getTime() + duration * 1000 + extraMinutes * 60 * 1000
  );

  const newBooking = await Booking.create({
    cycleId,
    userId: loggedInUser._id,
    startLocation: locationArray[0].coordinates,
    endLocation: locationArray[1].coordinates,
    startTime,
    estimatedEndTime,
    isRoundTrip,
    status: "pending",
    estimatedDistance: distance * 100,  // Map is sending distance in m, so converted to cm
    duration: duration
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Booking created successfully", newBooking));
});

// PATCH
const cancelBookingController = asyncHandler(async (req, res) => {
  const bookingId = req.params.bookingId;
  const loggedInUser = req.user;

  if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) 
    throw new ApiError(400, "Bad Request", "Valid Booking ID is required");

  const updatedBooking = await Booking.findOneAndUpdate(
    { _id: bookingId, userId: loggedInUser._id, status: "pending" },
    { status: "canceled" },
    { new: true }
  );

  if (!updatedBooking) {
    throw new ApiError(404, "Not Found", "Booking not found or already completed/canceled");
  }

  await Cycle.findOneAndUpdate(
    { _id: updatedBooking.cycleId, status: "booked" },
    { status: "available" },
    { new: true }
  );

  return res.status(200).json(new ApiResponse(200, "Booking cancelled successfully"));
});

// PATCH
const endBookingController = asyncHandler(async (req, res) => {
  console.log("endBookingController Called")
  console.log('endBookingController - req.user:', req.user?._id)

    const {bookingId} = req.params;
    const loggedInUser = req.user;
    const { actualEndTime, penaltyApplied, penaltyAmount } = req.penaltyInfo;

    let updatedUser = undefined

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) 
        throw new ApiError(400, "Bad Request", "Valid Booking ID is required");

    if (!actualEndTime || penaltyApplied===undefined) 
        throw new ApiError(400, "Bad Request", "Failed To access local time");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log('endBookingController - params.bookingId:', bookingId)
      console.log("updating booking")
        const updatedBooking = await Booking.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(bookingId), userId: loggedInUser._id, status: "pending" },
            { actualEndTime, penaltyApplied, penaltyAmount, status: "returned" },
            { new: true, session }
        )
      console.log("updating booking comspleted")

        if (!updatedBooking)
            throw new ApiError(404, "Not Found", "Booking not found or already completed/canceled");

        console.log("updating cycle")
        // For returned bookings, cycle remains booked until guard marks as received
        // Only update location for round trips, status stays "booked"
        const updateFields = {};

        if (!updatedBooking.isRoundTrip) {
            updateFields.currentLocation = {
                type: "Point",
                coordinates: updatedBooking.endLocation.coordinates, // [lng, lat]
            };
        }

        let updatedCycle;
        if (Object.keys(updateFields).length > 0) {
            updatedCycle = await Cycle.findOneAndUpdate(
                { _id: updatedBooking.cycleId, status: "booked" },
                { $set: updateFields },
                { new: true, session }
            );
        } else {
            updatedCycle = await Cycle.findById(updatedBooking.cycleId).session(session);
        }
        console.log("updating cycle completed")

        if (!updatedCycle) 
            throw new ApiError(404, "Not Found", "Cycle not found");
        
        console.log("updaing user")
        if(penaltyApplied && penaltyAmount > 0) {
            updatedUser = await User.findOneAndUpdate(
                { _id: loggedInUser._id },
                { hasPenalty: true, penaltyAmount: loggedInUser.penaltyAmount + penaltyAmount },
                { new: true, session }
            )
        }
        else updatedUser = loggedInUser;
        console.log("updaing user completed")

        await session.commitTransaction()
        console.log("Transaction commited")

        return res.status(200).json(new ApiResponse(200, "Cycle returned successfully. Waiting for guard verification.", {
            booking: updatedBooking,
            cycle: updatedCycle,
            user: updatedUser
        }));
    } 
    catch (error) {
        await session.abortTransaction();
        if(error instanceof ApiError)
            throw error;
        throw new ApiError(500, "Internal Server Error", "Failed to end booking", error.message);
    } 
    finally {
        session.endSession();
    }
})
//For now not correctly handling round trip, (currentCycleLocation)

// GET
const getBookings_merged = asyncHandler(async (req, res) => {
  const { bookingId, cycleId, userId } = req.query;
  const locations = req.locations || [];  

  // Combine query conditions
  const matchQuery = {};
  if (bookingId) matchQuery._id = new mongoose.Types.ObjectId(bookingId);
  if (cycleId) matchQuery.cycleId = new mongoose.Types.ObjectId(cycleId);
  if (userId) matchQuery.userId = new mongoose.Types.ObjectId(userId);
  
  if (locations.length > 0) {
    // locations array contains objects { name, coordinates }
    // Match the stored endLocation.point by coordinates
    // Booking.endLocation is a point object like { type: 'Point', coordinates: [lng, lat] }
    matchQuery['endLocation.coordinates'] = locations[0].coordinates.coordinates
  }

  const result = await Booking.aggregate([
    {
      $match: matchQuery,
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $project: {
        __v: 0,
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Bookings fetched successfully", result)
  );
});

// GET
const getActiveBookings = asyncHandler(async (req, res) => {
  const { userId, cycleId } = req.query;
  const locations = req.locations || [];

  console.log('getActiveBookings - query.userId:', userId)
  console.log('getActiveBookings - authenticated user:', req.user?._id)

  const matchQuery = {
    status: "pending",
  };

  if (userId && mongoose.Types.ObjectId.isValid(userId)) matchQuery.userId = new mongoose.Types.ObjectId(userId);
  if (cycleId && mongoose.Types.ObjectId.isValid(cycleId)) matchQuery.cycleId = new mongoose.Types.ObjectId(cycleId);
  if (locations.length > 0) {
    // match by coordinates array [lng, lat]
    matchQuery['endLocation.coordinates'] = locations[0].coordinates.coordinates;
  }

  const result = await Booking.aggregate([
    { $match: matchQuery },
    { $sort: { createdAt: -1 } },
  ]);

  if (!result)
    throw new ApiError(404, "No active bookings found");

  return res.status(200).json(
    new ApiResponse(200, "Booking successfully fetched", result)
  );
});

// GET - Get all returned bookings (for guards to see what needs to be received)
const getReturnedBookingsController = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const locations = req.locations || [];

  const matchQuery = {
    status: "returned"
  };

  // If userId is provided and valid, filter by userId
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    matchQuery.userId = new mongoose.Types.ObjectId(userId);
  }

  // If middleware provided locations (by name), match by coordinates
  if (locations.length > 0) {
    matchQuery['endLocation.coordinates'] = locations[0].coordinates.coordinates;
  }

  const returnedBookings = await Booking.aggregate([
    { $match: matchQuery },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $lookup: {
        from: "cycles",
        localField: "cycleId",
        foreignField: "_id",
        as: "cycle"
      }
    },
    {
      $unwind: "$user"
    },
    {
      $unwind: "$cycle"
    },
    {
      $project: {
        _id: 1,
        startTime: 1,
        actualEndTime: 1,
        endLocation: 1,
        isRoundTrip: 1,
        penaltyApplied: 1,
        penaltyAmount: 1,
        "user.userName": 1,
        "user.fullName": 1,
        "user.email": 1,
        "cycle.cycleNumber": 1,
        "cycle.model": 1,
        createdAt: 1,
        updatedAt: 1
      }
    },
    { $sort: { updatedAt: -1 } }
  ]);

  return res.status(200).json(new ApiResponse(200, "Returned bookings fetched successfully", returnedBookings));
});

export {createBookingController, endBookingController, getBookings_merged, getActiveBookings, cancelBookingController, getReturnedBookingsController, getStuckBookings}

