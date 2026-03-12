import mongoose from "mongoose";
import { Booking } from "../models/booking.model.js";
import { Cycle } from "../models/cycle.models.js";
import { User } from "../models/user.models.js";
import ApiError from "../utils/ApiError.utils.js";

const buildLocationMatch = (
  locations = [],
  field = "endLocation.coordinates",
) => {
  const matchQuery = {};
  if (locations.length > 0) {
    matchQuery[field] = locations[0].coordinates.coordinates;
  }
  return matchQuery;
};

const bookingLookupStages = [
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user",
    },
  },
  { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: "cycles",
      localField: "cycleId",
      foreignField: "_id",
      as: "cycle",
    },
  },
  { $unwind: { path: "$cycle", preserveNullAndEmptyArrays: true } },
];

const buildBookingAggregatePipeline = ({
  matchQuery,
  sort,
  project,
  limit,
}) => {
  const pipeline = [
    { $match: matchQuery },
    { $sort: sort },
    ...bookingLookupStages,
  ];

  if (project) {
    pipeline.push({ $project: project });
  }

  if (limit && Number(limit) > 0) {
    pipeline.push({ $limit: Number(limit) });
  }

  return pipeline;
};

const activeBookingProjection = {
  _id: 1,
  startTime: 1,
  estimatedEndTime: 1,
  duration: 1,
  status: 1,
  startLocation: 1,
  startLocationName: 1,
  endLocation: 1,
  endLocationName: 1,
  "user._id": 1,
  "user.userName": 1,
  "user.fullName": 1,
  "cycle._id": 1,
  "cycle.cycleName": 1,
  createdAt: 1,
  updatedAt: 1,
};

const returnedBookingProjection = {
  _id: 1,
  startTime: 1,
  actualEndTime: 1,
  startLocation: 1,
  startLocationName: 1,
  endLocation: 1,
  endLocationName: 1,
  isRoundTrip: 1,
  cycleId: 1,
  penaltyApplied: 1,
  penaltyAmount: 1,
  "user.userName": 1,
  "user.fullName": 1,
  "user.email": 1,
  "cycle.cycleName": 1,
  createdAt: 1,
  updatedAt: 1,
};

const adminBookingProjection = {
  _id: 1,
  status: 1,
  startLocation: 1,
  startLocationName: 1,
  endLocation: 1,
  endLocationName: 1,
  startTime: 1,
  actualEndTime: 1,
  estimatedEndTime: 1,
  estimatedDistance: 1,
  duration: 1,
  isRoundTrip: 1,
  createdAt: 1,
  updatedAt: 1,
  "user._id": 1,
  "user.userName": 1,
  "user.fullName": 1,
  "cycle._id": 1,
  "cycle.cycleName": 1,
};

const getStuckBookingsService = async ({ minutes, locations = [] }) => {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  const matchQuery = {
    status: "pending",
    startTime: { $lte: cutoff },
    ...buildLocationMatch(locations),
  };

  return Booking.aggregate([
    { $match: matchQuery },
    ...bookingLookupStages,
    {
      $project: {
        _id: 1,
        startTime: 1,
        userId: 1,
        cycleId: 1,
        status: 1,
        "user.userName": 1,
        "user.fullName": 1,
        "cycle.cycleName": 1,
        endLocation: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    { $sort: { startTime: -1 } },
  ]);
};

const createBookingService = async ({
  userId,
  cycleId,
  isRoundTrip,
  distance,
  duration,
  startTime,
  locations,
}) => {
  const cycle = await Cycle.findOneAndUpdate(
    { _id: cycleId, status: "available" },
    { status: "booked" },
    { new: true },
  );

  if (!cycle) throw new ApiError(400, "Cycle not found or already booked");

  const extraMinutes = isRoundTrip ? 10 : 5;
  const estimatedEndTime = new Date(
    startTime.getTime() + duration * 1000 + extraMinutes * 60 * 1000,
  );

  return Booking.create({
    cycleId,
    userId,
    startLocation: locations[0].coordinates,
    startLocationName: locations[0].name,
    endLocation: locations[1].coordinates,
    endLocationName: locations[1].name,
    startTime,
    estimatedEndTime,
    isRoundTrip,
    status: "pending",
    estimatedDistance: distance * 100,
    duration,
  });
};

const cancelBookingService = async ({ bookingId, userId }) => {
  const updatedBooking = await Booking.findOneAndUpdate(
    { _id: bookingId, userId, status: "pending" },
    { status: "canceled" },
    { new: true },
  );

  if (!updatedBooking) {
    throw new ApiError(
      404,
      "Not Found",
      "Booking not found or already completed/canceled",
    );
  }

  await Cycle.findOneAndUpdate(
    { _id: updatedBooking.cycleId, status: "booked" },
    { status: "available" },
    { new: true },
  );

  return updatedBooking;
};

const endBookingService = async ({ bookingId, loggedInUser, penaltyInfo }) => {
  const { actualEndTime, penaltyApplied, penaltyAmount } = penaltyInfo;
  let updatedUser;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(bookingId),
        userId: loggedInUser._id,
        status: "pending",
      },
      { actualEndTime, penaltyApplied, penaltyAmount, status: "returned" },
      { new: true, session },
    );

    if (!updatedBooking) {
      throw new ApiError(
        404,
        "Not Found",
        "Booking not found or already completed/canceled",
      );
    }

    const updateFields = {};
    if (!updatedBooking.isRoundTrip) {
      updateFields.currentLocation = {
        type: "Point",
        coordinates: updatedBooking.endLocation.coordinates,
      };
    }

    let updatedCycle;
    if (Object.keys(updateFields).length > 0) {
      updatedCycle = await Cycle.findOneAndUpdate(
        { _id: updatedBooking.cycleId, status: "booked" },
        { $set: updateFields },
        { new: true, session },
      );
    } else {
      updatedCycle = await Cycle.findById(updatedBooking.cycleId).session(
        session,
      );
    }

    if (!updatedCycle) throw new ApiError(404, "Not Found", "Cycle not found");

    if (penaltyApplied && penaltyAmount > 0) {
      updatedUser = await User.findOneAndUpdate(
        { _id: loggedInUser._id },
        {
          hasPenalty: true,
          penaltyAmount: loggedInUser.penaltyAmount + penaltyAmount,
        },
        { new: true, session },
      );
    } else {
      updatedUser = loggedInUser;
    }

    await session.commitTransaction();

    return {
      booking: updatedBooking,
      cycle: updatedCycle,
      user: updatedUser,
    };
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      "Internal Server Error",
      "Failed to end booking",
      error.message,
    );
  } finally {
    session.endSession();
  }
};

const getBookingsService = async ({
  bookingId,
  cycleId,
  userId,
  locations = [],
}) => {
  const matchQuery = {};
  if (bookingId) matchQuery._id = new mongoose.Types.ObjectId(bookingId);
  if (cycleId) matchQuery.cycleId = new mongoose.Types.ObjectId(cycleId);
  if (userId) matchQuery.userId = new mongoose.Types.ObjectId(userId);
  Object.assign(matchQuery, buildLocationMatch(locations));

  return Booking.aggregate([
    { $match: matchQuery },
    { $sort: { createdAt: -1 } },
    { $project: { __v: 0 } },
  ]);
};

const getActiveBookingsService = async ({
  userId,
  cycleId,
  locations = [],
}) => {
  const matchQuery = { status: "pending" };

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    matchQuery.userId = new mongoose.Types.ObjectId(userId);
  }
  if (cycleId && mongoose.Types.ObjectId.isValid(cycleId)) {
    matchQuery.cycleId = new mongoose.Types.ObjectId(cycleId);
  }

  Object.assign(matchQuery, buildLocationMatch(locations));

  return Booking.aggregate(
    buildBookingAggregatePipeline({
      matchQuery,
      sort: { createdAt: -1 },
      project: activeBookingProjection,
    }),
  );
};

const getReturnedBookingsService = async ({ userId, locations = [] }) => {
  const matchQuery = {
    status: "returned",
    ...buildLocationMatch(locations),
  };

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    matchQuery.userId = new mongoose.Types.ObjectId(userId);
  }

  return Booking.aggregate(
    buildBookingAggregatePipeline({
      matchQuery,
      sort: { updatedAt: -1 },
      project: returnedBookingProjection,
    }),
  );
};

const getAdminBookingsService = async ({ limit, locations = [] }) => {
  const matchQuery = buildLocationMatch(locations);

  return Booking.aggregate(
    buildBookingAggregatePipeline({
      matchQuery,
      sort: { createdAt: -1 },
      project: adminBookingProjection,
      limit,
    }),
  );
};

export {
  getStuckBookingsService,
  createBookingService,
  cancelBookingService,
  endBookingService,
  getBookingsService,
  getActiveBookingsService,
  getReturnedBookingsService,
  getAdminBookingsService,
};
