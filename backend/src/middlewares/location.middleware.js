import asyncHandler from "../utils/asyncHandler.utils.js";
import { Location } from "../models/location.model.js";
import ApiError from "../utils/ApiError.utils.js";


/*
    This middle ware is designed to handle geocoding => name to coordinates (based on saved locations)
    Scalability and other cases are kept in mind while designing, location can be sent as a filter (then in query) or in the body
    Also we may have more then one locations in body eg. in case when we create a booking (start-location and end-location)
    ***** So, frontend is responsible for handling sinle/multiple locations (based on use case) and pass all in a single array.*****
    then we add an array of coordinates in the req.

    SEQUENCE OF PASSING LOCATIONS
    left -> right
*/

export const geoCoding = asyncHandler(async (req, res, next) => {
  let locationNames = [];

  if (req.query?.location) 
    locationNames = [req.query.location];

  else if (Array.isArray(req.body?.location)) 
    locationNames = req.body.location;
  else if (req.body?.location && typeof req.body.location === 'string')
    locationNames = [req.body.location];

  if(locationNames.length <= 0)
    return next()

  const locations = [];

  for (const name of locationNames) {
    // Normalize incoming name to match schema (lowercase + trimmed)
    const normalized = String(name).trim().toLowerCase();
    const result = await Location.findOne({ name: normalized });

    if (!result) 
        throw new ApiError(404, `Location "${name}" not found`);

    const data = result.toJSON()

    const coordinates = {
      type: "Point",
      coordinates: [Number(data.coordinates.coordinates[0]), Number(data.coordinates.coordinates[1])]
    }

    locations.push({
        name: result?.name,
        coordinates: coordinates
    });
  }

  req.locations = locations
  console.log("location middleware", locations)

  next()
});