//getUserDetails, updateUserDetails, deleteUser, getAllUsers, getUserById

import mongoose from "mongoose";
import ApiError from "../utils/ApiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import { User } from "../models/user.models.js";

// GET
const getUserDetails_By_Id_UserName_AllController = asyncHandler(async (req, res) => {
  const { userId_userName } = req.query;

  let matchQuery = {};

  if(userId_userName && mongoose.Types.ObjectId.isValid(userId_userName))
    matchQuery = { _id: new mongoose.Types.ObjectId(userId_userName) };
  else if(userId_userName)
    matchQuery = { userName: userId_userName };

  const result = await User.aggregate([
    {
      $match: matchQuery, // If no param passed, this will match all users (matchQuery = {})
    },
    {
      $sort: { userName: -1 },
    },
    {
      $project: {
        password: 0,
        refreshToken: 0,
        __v: 0,
      },
    },
  ]);

  if (!result) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, 'User(s) fetched successfully'));
});

//PATCH
const updateUserDetailsController = asyncHandler(async (req, res) => {
  const loggedInUser = req.user;
  const { userName, email, phone } = req.body;
  const {userId} = req.params
  
  if(!userId || userId!=loggedInUser._id)
      throw new ApiError(404, "Invalid Request")

  const updatedUser = await User.findByIdAndUpdate(
    loggedInUser._id,
    {
      ...(userName && { userName }),
      ...(email && { email }),
      ...(phone && { phone }),
    },
    { new: true }
  );

  if (!updatedUser) 
    throw new ApiError(400, 'Failed to update user');

  const userObj = updatedUser.toObject();

  delete userObj.password;
  delete userObj.refreshToken;
  delete userObj.__v;

  return res
    .status(200)
    .json(new ApiResponse(200, userObj, 'User updated successfully'));
});

//DELETE
const deleteUserController = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const loggedInUser = req.user
  
  if(!userId || loggedInUser._id != userId)
    throw new ApiError(404, "Invalid Request")

  const user = await User.findById(userId);
  if (!user) 
    throw new ApiError(404, 'User not found');

  await user.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'User deleted successfully'));
});

export {getUserDetails_By_Id_UserName_AllController, updateUserDetailsController, deleteUserController}