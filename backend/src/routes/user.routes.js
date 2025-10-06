import express from "express"
import { getUserDetails_By_Id_UserName_AllController, updateUserDetailsController, deleteUserController, getAllUsersController } from "../controllers/user.controllers.js"
import verifyUser from "../middlewares/auth.middleware.js"
import { verifyAdmin } from "../middlewares/accessControl.middleware.js"

const userRouter = express.Router()

userRouter.route("").get(verifyUser, getUserDetails_By_Id_UserName_AllController)
userRouter.route("/all").get(verifyUser, verifyAdmin, getAllUsersController)
userRouter.route("/:userId").patch(verifyUser, updateUserDetailsController)
userRouter.route("/:userId").delete(verifyUser, verifyAdmin, deleteUserController)

export {userRouter}