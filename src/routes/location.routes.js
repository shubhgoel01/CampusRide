import express from "express"
import { addLocation, deleteLocation, updateLocation } from "../controllers/location.controller.js"
import { verifyAdmin } from "../middlewares/accessControl.middleware.js"
import verifyUser from "../middlewares/auth.middleware.js"

const locationRouter = express.Router()

locationRouter.route("").post(verifyUser, verifyAdmin, addLocation)
locationRouter.route("/:locationId").delete(verifyUser, verifyAdmin, deleteLocation)
locationRouter.route("/:locationId").patch(verifyUser, verifyAdmin, updateLocation)

export {locationRouter}