import express from "express"
import { addCycleController, deleteCycleController, getAvailableCycleControllerMerged, get_all_cyclesController_merged } from "../controllers/cycle.controllers.js";
import verifyUser from "../middlewares/auth.middleware.js";
import { accessHandler } from "../middlewares/isAdmin.js";
import { geoCoding } from "../middlewares/location.middleware.js";

const cycleRouter = express.Router()

cycleRouter.route("/").get(verifyUser, get_all_cyclesController_merged)
cycleRouter.route("/available").get(verifyUser, getAvailableCycleControllerMerged)
cycleRouter.route("/").post(verifyUser, accessHandler,geoCoding, addCycleController)
cycleRouter.route("/:cycleId").delete(verifyUser, accessHandler, deleteCycleController)

export {cycleRouter}