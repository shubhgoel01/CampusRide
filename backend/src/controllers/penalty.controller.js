// incurPenalty (add remove penalty amount to user), paymentIntegration (handle payment integration with razorpay)

import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import ApiError from "../utils/ApiError.utils.js";

//PATCH
const settlePenalty = asyncHandler(async (req, res) => {
  const loggedInUser = req.user; 
  const { userId } = req.params;
  const { amountPaid } = req.body;

  if (!userId || userId !== loggedInUser._id.toString()) {
    throw new ApiError(403, 'Unauthorized or invalid user ID');
  }
    
  if (!amountPaid || isNaN(amountPaid) || amountPaid <= 0)
    throw new ApiError(400, 'Please provide a valid penalty amount to settle');

  // Calculate updated penalty amount and hasPenalty flag
  const remaining = Math.max(0, (loggedInUser.penaltyAmount || 0) - Number(amountPaid));
    
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: {
        penaltyAmount: remaining,
        hasPenalty: remaining > 0,
    } },
    { new: true }
  );
  
  if (!updatedUser) throw new ApiError(404, 'User not found');
  res.status(200).json(
    new ApiResponse(200, 'Penalty settled successfully', updatedUser)
  );
});

export {settlePenalty}