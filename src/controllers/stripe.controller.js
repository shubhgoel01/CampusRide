import { stripe } from "../utils/stripe.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import { Transaction } from "../models/trannsaction.model.js";
import { User } from "../models/user.models.js";
import ApiError from "../utils/ApiError.utils.js";

const createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // amount in paise
    currency: "inr",
    automatic_payment_methods: {
      enabled: true
    },
  });

  res.status(200).json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,    // Normally we just send clientSecret to frontend
  });
});

const createTransaction = asyncHandler(async (req, res) => {
  const { paymentIntentId, bookingId } = req.body;
  const user = req.user;

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  const transaction = await Transaction.create({
    paymentIntentId,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    userId: user._id,
    bookingId
  });

  if(paymentIntent.status != "succeeded")
    throw new ApiError(500, "Payment Failed", new Error(paymentIntent.cancellation_reason))

  res.status(200).json({ success: true, transaction });
});

export {createPaymentIntent, createTransaction}


// REFERENCE DOCUMENTATION => https://docs.stripe.com/api/payment_intents