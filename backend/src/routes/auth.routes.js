import express from "express"
import verifyUser from "../middlewares/auth.middleware.js"
import { registerController, loginController, logoutController, refreshAccessTokenController } from "../controllers/auth.controllers.js"

const authRouter = express.Router();

authRouter.route("/register").post(registerController)
authRouter.route("/login").post(loginController)
authRouter.route("/:userId/logout").post(verifyUser, logoutController)
authRouter.route("/refresh").post(refreshAccessTokenController)

export {authRouter}
