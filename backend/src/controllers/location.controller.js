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
    const { name } = req.body
    const { locationId } = req.params

    let location = null

    if (locationId) {
      // try delete by id
      if (!mongoose.Types.ObjectId.isValid(locationId)) throw new ApiError(400, 'Invalid location id')
      location = await Location.findByIdAndDelete(locationId)
    } else if (name) {
      location = await Location.findOneAndDelete({ name: name })
    } else {
      throw new ApiError(400, "Location id or name is required");
    }

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

// GET - get location by id
const getLocationById = asyncHandler(async (req, res) => {
  const { locationId } = req.params
  if (!locationId) throw new ApiError(400, 'Location id required')
  if (!mongoose.Types.ObjectId.isValid(locationId)) throw new ApiError(400, 'Invalid location id')
  const loc = await Location.findById(locationId)
  if (!loc) throw new ApiError(404, 'Location not found')
  return res.status(200).json(new ApiResponse(200, 'Location fetched', loc))
})

// (exports consolidated at end of file)

// POST - lookup location name by coordinates
const lookupLocationByCoordinates = asyncHandler(async (req, res) => {
  const { coordinates } = req.body; // expects [lng, lat]
  if (!Array.isArray(coordinates) || coordinates.length !== 2)
    throw new ApiError(400, 'Bad Request', 'Coordinates must be an array [lng, lat]');

  // Try exact match first
  const exact = await Location.findOne({ 'coordinates.coordinates': coordinates });
  if (exact) return res.status(200).json(new ApiResponse(200, 'Location found', { name: exact.name }));

  // Use a near query with a small radius (in meters) - convert to radians required by GeoJSON? Mongo accepts meters with $nearSphere when utilizing 2dsphere indexes using $geometry and $maxDistance
  const [lng, lat] = coordinates.map(Number);
  const nearby = await Location.findOne({
    coordinates: {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: 50 // 50 meters
      }
    }
  });

  if (nearby) return res.status(200).json(new ApiResponse(200, 'Location found', { name: nearby.name }));

  throw new ApiError(404, 'Not Found', 'No location found near provided coordinates');
});


// GET - list locations (id and name) for dropdowns
const getLocations = asyncHandler(async (req, res) => {
  const result = await Location.find({}, { name: 1 }).sort({ name: 1 });
  return res.status(200).json(new ApiResponse(200, 'Locations fetched successfully', result));
});

export { addLocation, deleteLocation, updateLocation, lookupLocationByCoordinates, getLocations, getLocationById }
