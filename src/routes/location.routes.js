import express from "express"
import { addLocation, deleteLocation, updateLocation } from "../controllers/location.controller.js"
import { accessHandler } from "../middlewares/isAdmin.js"
import verifyUser from "../middlewares/auth.middleware.js"

const locationRouter = express.Router()

locationRouter.route("").post(verifyUser, accessHandler, addLocation)
locationRouter.route("/:locationId").delete(verifyUser, accessHandler, deleteLocation)
locationRouter.route("/:locationId").patch(verifyUser, accessHandler, updateLocation)

export {locationRouter}