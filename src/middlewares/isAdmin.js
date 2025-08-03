import asyncHandler from "../utils/asyncHandler.utils.js";

const accessHandler = asyncHandler(async(req, res, next)=>{
    const loggedInUser = req.user
    if(loggedInUser.isAdmin)
        next()
    else throw new ApiError(400, "You are not authorized")
})

export {accessHandler}