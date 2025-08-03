// userAccessControllers - getAllCycles, getCycleById, getCyclesByLocation, getAvailableCycles
// adminAcessControllers - userAdminControllers - deleteCycle, createCycle, updateCycle (maintenance/notAvailable)

import mongoose from "mongoose";
import ApiError from "../utils/ApiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import { Cycle } from "../models/cycle.models.js";

// GET, use io.socket here later to reflect latest status
const get_all_cyclesController_merged = asyncHandler(async(req, res) => {
    const {cycleId, latitude, longitude} = req.query
    let getCycleByIdQuery = {}, getCyclesByLocation = {} 

    if(cycleId)
        getCycleByIdQuery = {_id: new mongoose.Types.ObjectId(cycleId)}
    if(latitude && longitude){
        const location = {
            latitude: Number(latitude),
            longitude: Number(longitude)
        }
        console.log(location)
        getCyclesByLocation = {currentLocation: location}
    }
        
    const result = await Cycle.aggregate([
        {
            $match: {
                ...getCycleByIdQuery,
                ...getCyclesByLocation
            }
        },
        {
            $sort: {cycleName: -1}
        },
        {
            $project: {
                __v: 0
            }
        }
    ])

    if(!result)
        throw new ApiError()

    res.status(200).json(new ApiResponse(200, "Data fetched successfully", result))    
})

// GET
const getAvailableCycleControllerMerged =   asyncHandler(async(req, res) => {
    const {cycleId, location} = req.query
    let getCycleByIdQuery = {}, getCyclesByLocation = {} 

    console.log("cycleId", cycleId)

    if(cycleId)
        getCycleByIdQuery = {_id: new mongoose.Types.ObjectId(cycleId)}
    if(location)
        getCyclesByLocation = {currentLocation: location}

    const result = await Cycle.aggregate([
        {
            $match: {
                ...getCycleByIdQuery,
                ...getCyclesByLocation,
                status: "available"
            }
        },
        {
            $limit: 1
        },
        {
            $project: {
                __v: 0
            }
        }
    ])

    if (!result || result.length === 0)
        throw new ApiError(404, "Not Found", "No available cycles found.");

    res.status(200).json(new ApiResponse(200, "Data fetched successfully", result))
})

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
