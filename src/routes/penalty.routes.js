import express from "express"
import { settlePenalty } from "../controllers/penalty.controller.js"
import verifyUser from "../middlewares/auth.middleware.js"

const penaltyRouter = express.Router()

penaltyRouter.route("/:userId").patch(verifyUser, settlePenalty)

export {penaltyRouter}