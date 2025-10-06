import express from "express"
import { addLocation, deleteLocation, updateLocation, getLocations } from "../controllers/location.controller.js"
import { lookupLocationByCoordinates } from "../controllers/location.controller.js"
import { verifyAdmin } from "../middlewares/accessControl.middleware.js"
import verifyUser from "../middlewares/auth.middleware.js"

const locationRouter = express.Router()

// GET - list locations (public)
locationRouter.route("").get(getLocations).post(verifyUser, verifyAdmin, addLocation)
// lookup location by coordinates (public)
locationRouter.route("/lookup").post(lookupLocationByCoordinates)
locationRouter.route("/:locationId").delete(verifyUser, verifyAdmin, deleteLocation)
locationRouter.route("/:locationId").patch(verifyUser, verifyAdmin, updateLocation)

export {locationRouter}