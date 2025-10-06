import asyncHandler from "../utils/asyncHandler.utils.js";
import ApiError from "../utils/ApiError.utils.js";

// Admin access control
const verifyAdmin = asyncHandler(async(req, res, next)=>{
    const loggedInUser = req.user
    if(loggedInUser.userType === "admin")
        next()
    else throw new ApiError(403, "Forbidden", "Admin privileges required")
})

// Guard access control
const verifyGuard = asyncHandler(async(req, res, next)=>{
    const loggedInUser = req.user
    if(loggedInUser.userType === "guard")
        next()
    else throw new ApiError(403, "Forbidden", "Guard privileges required")
})

// Admin or Guard access control
const verifyAdminOrGuard = asyncHandler(async(req, res, next)=>{
    const loggedInUser = req.user
    if(loggedInUser.userType === "admin" || loggedInUser.userType === "guard")
        next()
    else throw new ApiError(403, "Forbidden", "Admin or Guard privileges required")
})

export { verifyAdmin, verifyGuard, verifyAdminOrGuard }