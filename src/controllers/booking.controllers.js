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
    const {bookingId} = req.params;
    const loggedInUser = req.user;
    const { actualEndTime, penaltyApplied, penaltyAmount } = req.penaltyInfo;
    console.log("PenaltyInfo", req.penaltyInfo)
    console.log("actualEndTime", actualEndTime)
    console.log("penaltyApplied", penaltyApplied)
    console.log("penaltyAmount", penaltyAmount)


    let updatedUser = undefined

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) 
        throw new ApiError(400, "Bad Request", "Valid Booking ID is required");

    if (!actualEndTime || penaltyApplied===undefined) 
        throw new ApiError(400, "Bad Request", "Failed To access local time");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const updatedBooking = await Booking.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(bookingId), userId: loggedInUser._id, status: "pending" },
            { actualEndTime, penaltyApplied, penaltyAmount, status: "completed" },
            { new: true, session }
        )

        if (!updatedBooking)
            throw new ApiError(404, "Not Found", "Booking not found or already completed/canceled");

        const updatedCycle = await Cycle.findOneAndUpdate(
            { _id: updatedBooking.cycleId, status: "booked" },
            { status: "available", currentLocation:  updatedBooking?.endLocation},
            { new: true, session }
        )  

        if (!updatedCycle) 
            throw new ApiError(404, "Not Found", "Cycle not found or already available");
    
        if(penaltyApplied && penaltyAmount > 0) {
            updatedUser = await User.findOneAndUpdate(
                { _id: loggedInUser._id },
                { hasPenalty: true, penaltyAmount: loggedInUser.penaltyAmount + penaltyAmount },
                { new: true, session }
            )
        }
        else updatedUser = loggedInUser;

        await session.commitTransaction()

        return res.status(200).json(new ApiResponse(200, "Booking ended successfully", {
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
  const { bookingId, cycleId, userId, longitude, latitude } = req.query;

  // Combine query conditions
  const matchQuery = {};
  if (bookingId) matchQuery._id = new mongoose.Types.ObjectId(bookingId);
  if (cycleId) matchQuery.cycleId = new mongoose.Types.ObjectId(cycleId);
  if (userId) matchQuery.userId = new mongoose.Types.ObjectId(userId);
  if (longitude && latitude){
    const endLocation = {
      longitude: Number(longitude),
      latitude: Number(latitude)
    }
    console.log(endLocation)
     matchQuery.endLocation = endLocation;
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
const getActiveBookings = asyncHandler(async(req, res) => {
    const {userId, cycleId, endLocation} = req.query
    let getActiveBookingByUserIdQuery = {}, getActiveBookingByCycleIdQuery=  {}, getActiveBookingsByEndLocationQuery = {}

    if(userId)
        getActiveBookingByUserIdQuery = {userId: userId}
    if(cycleId)
        getActiveBookingByCycleIdQuery= {cycleId: cycleId}
    if(endLocation)
        getActiveBookingsByEndLocationQuery = {endLocation: endLocation}

    const result = await Booking.aggregate([
        {
            $match: {
                ...getActiveBookingByUserIdQuery,
                ...getActiveBookingByCycleIdQuery,
                ...getActiveBookingsByEndLocationQuery,
                status: "pending"
            }
        },
        {
            $sort : {createdAt : -1}
        },
        {
            $project: {
                "__v": 0
            }
        }
    ])

    if(!result)
        throw new ApiError()

    return res.status(200).json(new ApiResponse(200, "Booking Successfully Fetched", result))
})

export {createBookingController, endBookingController, getBookings_merged, getActiveBookings, cancelBookingController}

