// updateUserLocation, getCurrentLocation, addLocation, removeLocation, updateLocation, searchLocation

import mongoose from "mongoose";
import ApiError from "../utils/ApiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import { Location } from "../models/location.model.js";

// POST
const addLocation = asyncHandler(async(req, res) => {
     const {longitude, latitude, name} = req.body;

     const existingLocation = await Location.findOne({name: name})
     if(existingLocation)
        throw new ApiError(400, "Location name already exist")

     const response = await Location.create({
        name: name,
        coordinates: {
            type: "Point",
            coordinates: [longitude, latitude]
        }
     })

     if(!response)
        throw new ApiError(500, "Failed to add location")

     return res.status(200).json(new ApiResponse(200, "Location Added", response))
})

// DELETE
const deleteLocation = asyncHandler(async(req, res)=>{
    const {name} = req.body
    if (!name) throw new ApiError(400, "Location name is required");
    
    const location = await Location.findOneAndDelete({name: name});
    if(!location)
        throw new ApiError(404, "Location not found")
    
    return res.status(200).json(new ApiResponse(200, "Location Deleted"));
})

// PATCH
const updateLocation = asyncHandler(async (req, res) => {
  const { name, longitude, latitude } = req.body;

  if (!name) 
    throw new ApiError(400, "Location Name required");

  const updateFields = {};
  if(name) updateFields["name"] = name;
  if (longitude) updateFields["coordinates.coordinates.0"] = longitude;
  if (latitude) updateFields["coordinates.coordinates.1"] = latitude;

  const response = await Location.findOneAndUpdate(
    { name: name },
    { $set: updateFields },
    { new: true }
  );

  // Note: HERE WE HAVE TO USE $set, therwise wrong, when we are updating directFields then we do not need to use set, but if we are updating subFields then we require to use set

  if (!response) throw new ApiError(404, "Location not found");

  res.status(200).json({
    success: true,
    message: "Location updated",
    location: response
  });
});

export {addLocation, deleteLocation, updateLocation}