import asyncHandler from "../utils/asyncHandler.utils.js"
import jwt from "jsonwebtoken"
import ApiError from "../utils/ApiError.utils.js"
import { User } from "../models/user.models.js"
const verifyUser = asyncHandler(async (req, res, next) => {
    console.log(req.cookies)
    const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    console.log("verify user called")

    if(!accessToken){
        console.log("verifyUser Access token not found")
        throw new ApiError(401, "Unauthorized Access", "accessToken not found", "verifyUser: auth.middleWare.js")
    }

    const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
    console.log("decoded token", decodedToken)
    
    if(!decodedToken){
        console.log("decoded token not found")
        throw new ApiError(401, "Unauthorized Access", "accessToken has expired", "verifyUser: auth.middleWare.js")
    }

    const user = await User.findById(decodedToken?._id).select("-password -refreshtoken")

    if(!user)
        throw new ApiError(401, "User not found")

    req.user = user

    console.log("verify user ended")
    next()
})

export default verifyUser
