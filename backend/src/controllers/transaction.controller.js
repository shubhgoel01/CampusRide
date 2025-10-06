import asyncHandler from "../utils/asyncHandler.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import ApiError from "../utils/ApiError.utils.js";
import mongoose from "mongoose";
import { Transaction } from "../models/transaction.model.js";

const getTransactionsByUserOrBooking = asyncHandler(async (req, res) => {
  const { userId, bookingId } = req.query;

  const match = {};
  if (userId && mongoose.Types.ObjectId.isValid(userId)) match.userId = new mongoose.Types.ObjectId(userId);
  if (bookingId && mongoose.Types.ObjectId.isValid(bookingId)) match.bookingId = new mongoose.Types.ObjectId(bookingId);

  const result = await Transaction.find(match).sort({ createdAt: -1 }).lean();

  return res.status(200).json(new ApiResponse(200, 'Transactions fetched', result));
});

const getTransactionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, 'Invalid transaction id');

  const tx = await Transaction.findById(id).lean();
  if (!tx) throw new ApiError(404, 'Transaction not found');

  return res.status(200).json(new ApiResponse(200, 'Transaction fetched', tx));
});

export { getTransactionsByUserOrBooking, getTransactionById };
