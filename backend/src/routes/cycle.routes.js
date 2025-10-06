import express from "express"
import { addCycleController, deleteCycleController, getAvailableCycleControllerMerged, get_all_cyclesController_merged } from "../controllers/cycle.controllers.js";
import verifyUser from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/accessControl.middleware.js";
import { geoCoding } from "../middlewares/location.middleware.js";

const cycleRouter = express.Router()

cycleRouter.route("/").get(verifyUser, geoCoding, get_all_cyclesController_merged)
cycleRouter.route("/available").get(verifyUser, geoCoding, getAvailableCycleControllerMerged)
cycleRouter.route("/").post(verifyUser, verifyAdmin,geoCoding, addCycleController)
cycleRouter.route("/:cycleId").delete(verifyUser, verifyAdmin, deleteCycleController)

export {cycleRouter}