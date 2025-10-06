import { Booking } from "../models/booking.model.js";
import ApiError from "../utils/ApiError.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import mongoose from "mongoose";
import { calculatePenaltyAmount } from "../utils/helperFunctions.utils.js";

const newBookingHandler = asyncHandler(async(req, res, next)=>{
    const loggedInUser = req.user
    if(loggedInUser.hasPenalty || loggedInUser.penaltyAmount > 0)
        throw new ApiError(404, "Please clear your penalty first")

    // Prevent creating a new booking if user already has a pending or returned booking
    const existingBooking = await Booking.findOne({
        userId: loggedInUser._id,
        status: { $in: ["pending", "returned"] }
    })
    if(existingBooking)
        throw new ApiError(400, "You already have an active or returned booking awaiting verification. Please finish or wait for verification before creating a new booking")

    next()
})

const endBookingHandler = asyncHandler(async(req, res, next)=>{
    console.log("nedBooking middleware called")

    const {bookingId} = req.params;
    const loggedInUser = req.user

    const booking = await Booking.findById(new mongoose.Types.ObjectId(bookingId));
    console.log("booking", booking)
    if (!booking || !booking.userId.equals(loggedInUser._id)) 
        throw new ApiError(404, 'Booking not found');

    const now = Date.now();
    const expectedEnd = booking.estimatedEndTime.getTime();

    const penaltyApplied = now > expectedEnd;
    const penaltyAmount = penaltyApplied
        ? calculatePenaltyAmount(now, expectedEnd)
        : 0;

    req.penaltyInfo = {
        actualEndTime: now,
        penaltyApplied: penaltyApplied,
        penaltyAmount: penaltyAmount,
    };

    console.log("nedBooking middleware ended")

  next();
})
//Not correctly calculating penalties

export {newBookingHandler, endBookingHandler}