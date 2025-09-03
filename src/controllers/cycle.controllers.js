// userAccessControllers - getAllCycles, getCycleById, getCyclesByLocation, getAvailableCycles
// adminAcessControllers - userAdminControllers - deleteCycle, createCycle, updateCycle (maintenance/notAvailable)

import mongoose from "mongoose";
import ApiError from "../utils/ApiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import { Cycle } from "../models/cycle.models.js";

// GET, use io.socket here later to reflect latest status
const get_all_cyclesController_merged = asyncHandler(async (req, res) => {
  console.log("get_all_cyclesController_merged called")
  const { cycleId } = req.query;
  const locations = req.locations || [];
  console.log("getAllCycles", locations);

  const matchQuery = {};
  if (cycleId) matchQuery._id = new mongoose.Types.ObjectId(cycleId);
  if (locations.length > 0) matchQuery.currentLocation = locations[0].coordinates;

  console.log(matchQuery)

  const result = await Cycle.aggregate([
    { $match: matchQuery },
    { $sort: { cycleName: -1 } },
  ]);

  if (!result || result.length === 0) {
    throw new ApiError(404, "No matching cycles found");
  }

  return res.status(200).json(
    new ApiResponse(200, "Data fetched successfully", result)
  );
});


// GET
const getAvailableCycleControllerMerged = asyncHandler(async (req, res) => {
  console.log("getAvailableCycleControllerMerged called")
  const { cycleId } = req.query;
  const locations = req.locations || [];

  const matchQuery = {
    status: "available",
  };

  if (cycleId) {
    matchQuery._id = new mongoose.Types.ObjectId(cycleId);
  }

  if (locations.length > 0) {
    matchQuery.currentLocation = locations[0].coordinates;
  }

  const result = await Cycle.aggregate([
    { $match: matchQuery },
    { $limit: 1 },
    { $project: { __v: 0 } }
  ]);

  if (!result || result.length === 0) {
    throw new ApiError(404, "Not Found", "No available cycles found.");
  }

  return res.status(200).json(
    new ApiResponse(200, "Data fetched successfully", result)
  );
});

// POST, adminAccess
const addCycleController = asyncHandler(async (req, res) => {
  const { cycleName, status } = req.body;
  const location = req.locations[0]

  console.log("cycleName", cycleName)
  console.log("locationReceived", location)
  console.log("status", status)

  if (!cycleName || !status)
    return res.status(400).json({ message: 'Please provide all required fields' });

  const existingCycle = await Cycle.findOne({ cycleName });
  if (existingCycle) 
    return res.status(400).json({ message: 'Cycle with this ID already exists' });

  const currentLocation = {
    name: location.name,
    coordinates: [
        Number(location.coordinates.coordinates[0]),
        Number(location.coordinates.coordinates[1])
    ]
  }

  console.log(currentLocation)

  const newCycle = new Cycle({
    cycleName,
    currentLocation: currentLocation,
    status
  });

  await newCycle.save();

  res.status(201).json(new ApiResponse(201, 'Cycle added successfully', newCycle ));
});

// DLETE, adminAccess
const deleteCycleController = asyncHandler(async (req, res) => {
  const { cycleId } = req.params;

  const cycle = await Cycle.findById(cycleId);
  if (!cycle) 
    return res.status(404).json(new ApiError(404, "Cycle Not Found"));

  await cycle.deleteOne();
  res.status(200).json(new ApiResponse(200, "Cycle Deleted Successfully"));
});

export {get_all_cyclesController_merged, getAvailableCycleControllerMerged, addCycleController, deleteCycleController} 
