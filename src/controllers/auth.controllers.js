//register, login, logout, refreshToken

import ApiError from "../utils/ApiError.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import { User } from "../models/user.models.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// POST
const registerController = asyncHandler(async(req, res) => {
    const {userName, email, password, fullName, userType = "student"} = req.body;
    if(!userName || !email || !password || !fullName)
        throw new ApiError(400, "Bad Request", "All fields are required");

    // Validate userType
    if(userType && !["student", "admin", "guard"].includes(userType))
        throw new ApiError(400, "Bad Request", "Invalid user type. Must be student, admin, or guard");

    let alreadyExists = await User.aggregate([
        {
            $match: {
                $or: [
                    {userName: userName},
                    {email: email}
                ]
            }
        },
        {
            $project: {
                "refreshToken": 0,
                "__v": 0
            }
        }
    ])

    if(alreadyExists.length > 0)
        throw new ApiError(400, "Bad Request", "User already exists with this username or email");

    const newUser = new User({
        userName,
        email,
        password,
        fullName, 
        userType
    });

    const newRefreshToken = await newUser.generateRefreshToken();
    const accessToken = newUser.generateAccessToken();
    if(!newRefreshToken || !accessToken)
        throw new ApiError(500, "Internal Server Error", "Failed to generate tokens");

    newUser.refreshToken = newRefreshToken;
    const saveduser = await newUser.save();

    delete saveduser.password;
    delete saveduser.refreshToken;
    delete saveduser.__v;

    if(!saveduser)
        throw new ApiError(500, "Internal Server Error", "Failed to save user");

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200, "User registered successfully", {
            user: saveduser,
            accessToken: accessToken,
            refreshToken: newRefreshToken
        }));
})

// POST
const loginController = asyncHandler(async(req, res) => {
    const {email, password, userName} = req.body;
    if((!email && !userName) || !password)
        throw new ApiError(400, "Bad Request", "Email and password are required");

    const query = email ? { email } : { userName };

    const user = await User.findOne(query);
    if(!user)
        throw new ApiError(404, "Not Found", "User not found");

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if(!isPasswordCorrect)
        throw new ApiError(401, "Unauthorized", "Invalid email or password");

    const newRefreshToken = await user.generateRefreshToken();
    const newAccessToken = await user.generateAccessToken();

    console.log("Generated access Token", newAccessToken)
    if(!newRefreshToken || !newAccessToken)
        throw new ApiError(500, "Internal Server Error", "Failed to generate tokens");

    user.refreshToken = newRefreshToken;
    const savedUser = await user.save();

    if(!savedUser)
        throw new ApiError(500, "Internal Server Error", "Failed to save user");

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200, "Login successful", {
            user: savedUser,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        }));
})

// POST
const logoutController = asyncHandler(async(req, res) => {
    const loggedInUser = req.user;
    const {userId} = req.params

    console.log("LoggedInUser", loggedInUser)
    console.log("userId", typeof userId)

    if (!mongoose.Types.ObjectId.isValid(userId) || userId !== loggedInUser._id.toString()) 
        throw new ApiError(404, "Invalid Request", "User mismatch or invalid ID");

    const response = await User.findByIdAndUpdate(
        loggedInUser._id, 
        {
            $set: {
                refreshToken: ""
            }
        },
        {new: true}
    );

    if(!response)
        throw new ApiError(500, "Internal Server Error", "Failed to logout user");

    const options = {
        httpOnly: true,
        secure: true,
        expires: new Date(Date.now())
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "Logout successful"));
})

// POST
const refreshAccessTokenController = asyncHandler(async(req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ", "");

    if(!refreshToken)
        throw new ApiError(401, "Unauthorized", "Refresh token not found");

    const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    if(!decodedToken)
        throw new ApiError(401, "Unauthorized", "Refresh token has expired");

    const user = await User.findById(decodedToken._id)

    console.log("user", user)
    console.log("refreshToken", refreshToken)
    
    if(!user || user.refreshToken !== refreshToken)
        throw new ApiError(401, "Unauthorized", "Invalid refresh token");

    const newAccessToken = await user.generateAccessToken();
    const newRefreshToken = await user.generateRefreshToken();

    if(!newAccessToken || !newRefreshToken)
        throw new ApiError(500, "Internal Server Error", "Failed to generate access token");
    
    const loggedInUser = await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken }, { new: true });

    return res
        .status(200)
        .cookie("accessToken", newAccessToken, {httpOnly: true, secure: true})
        .json(new ApiResponse(200, "Access token refreshed successfully", {
            user: loggedInUser,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        }));
})

export {registerController, loginController, logoutController, refreshAccessTokenController}