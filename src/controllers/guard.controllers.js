import asyncHandler from "../utils/asyncHandler.utils.js";
import ApiError from "../utils/ApiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import mongoose from "mongoose";
import { Booking } from "../models/booking.model.js";
import { Cycle } from "../models/cycle.models.js";

// PATCH - Mark cycle as received by guard
const markCycleReceivedController = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const guardUser = req.user;

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
        throw new ApiError(400, "Bad Request", "Valid Booking ID is required");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Find the booking that is in "returned" status
        const booking = await Booking.findOne({
            _id: new mongoose.Types.ObjectId(bookingId),
            status: "returned"
        }).session(session);

        if (!booking) {
            throw new ApiError(404, "Not Found", "Booking not found or not in returned status");
        }

        // Update booking to completed status and add guard info
        const updatedBooking = await Booking.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(bookingId) },
            { 
                status: "completed",
                receivedBy: guardUser._id,
                receivedAt: new Date()
            },
            { new: true, session }
        );

        // Update cycle status to available and location if not round trip
        const updateFields = {
            status: "available",
        };

        if (!updatedBooking.isRoundTrip) {
            updateFields.currentLocation = {
                type: "Point",
                coordinates: updatedBooking.endLocation.coordinates, // [lng, lat]
            };
        }

        const updatedCycle = await Cycle.findOneAndUpdate(
            { _id: updatedBooking.cycleId, status: "booked" },
            { $set: updateFields },
            { new: true, session }
        );

        if (!updatedCycle) {
            throw new ApiError(404, "Not Found", "Cycle not found or already available");
        }

        await session.commitTransaction();

        return res.status(200).json(new ApiResponse(200, "Cycle marked as received successfully", {
            booking: updatedBooking,
            cycle: updatedCycle,
            receivedBy: {
                _id: guardUser._id,
                userName: guardUser.userName,
                fullName: guardUser.fullName
            }
        }));

    } catch (error) {
        await session.abortTransaction();
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, "Internal Server Error", "Failed to mark cycle as received", error.message);
    } finally {
        session.endSession();
    }
});

export { markCycleReceivedController };
