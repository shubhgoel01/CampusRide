import dotenv from "dotenv";
dotenv.config();

import asyncHandler from "../utils/asyncHandler.utils.js";
import ApiError from "../utils/ApiError.utils.js";

const getDistanceAndTime = asyncHandler(async (req, res, next) => {
  const locations = req.locations;
  if (!locations || locations.length < 2) return next();

  const apiKey = process.env.GOOGLEMAPS_API_KEY;
  if (!apiKey) throw new ApiError(500, "Missing Google_maps API key");

  const origin = `${locations[0].coordinates.coordinates[0]},${locations[0].coordinates.coordinates[1]}`;
  const destination = `${locations[1].coordinates.coordinates[0]},${locations[1].coordinates.coordinates[1]}`;
  const mode = "bicycling"

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?destinations=${destination}&origins=${origin}&key=${apiKey}`;

  console.log("url", url)
  

  const response = await fetch(url);

  console.log(response)
  if (!response.ok)
    throw new ApiError(response.status, "Google_maps_Api API request failed");

  const data = await response.json();
  console.log("data", data)
   const element = data.rows?.[0]?.elements?.[0];
  if (element.status !== "OK") {
    throw new Error(`Distance Matrix error: ${element.status}`);
  }

    console.log("distanceText", element.distance.text),
    console.log("distanceValue", element.distance.value), // in meters
    console.log( "durationText", element.duration.text),
    console.log("durationValue", element.duration.value)

  // You can attach it to req if needed later in controller
  req.routeInfo = {
    distance: element.distance.value,
    duration: element.duration.value,
    startTime: new Date(),
  };

  next();
});

export default getDistanceAndTime;