import { stripe } from "../utils/stripe.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import { Transaction } from "../models/transaction.model.js";
import { User } from "../models/user.models.js";
import ApiError from "../utils/ApiError.utils.js";

const DEFAULT_CURRENCY = "inr";

const createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const { bookingId } = req.params;
  console.log('[stripe] createPaymentIntent called', { bookingId, amount, user: req.user?._id });

  const amountNum = Number(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    throw new ApiError(400, 'Invalid amount provided. Amount must be a positive number (in rupees).');
  }

  const amountPaise = Math.round(amountNum * 10000);

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: amountPaise,
      currency: "inr",
      automatic_payment_methods: { enabled: true },
    });
  } catch (err) {
    console.error('[stripe] paymentIntents.create error', err);
    const stripeMessage = err?.raw?.message || err?.message || 'Stripe error';
    const stripeCode = err?.raw?.code || err?.code || null;
    if (err?.statusCode === 400 || stripeCode === 'amount_too_small') {
      throw new ApiError(400, stripeMessage);
    }

    throw new ApiError(500, 'Failed to create payment intent');
  }

  res.status(200).json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  });
});

// Verify & save transaction
const createTransaction = asyncHandler(async (req, res) => {
  const { paymentIntentId, bookingId } = req.body;
  const user = req.user;
  if (!paymentIntentId) throw new ApiError(400, "paymentIntentId required");

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status !== "succeeded") {
    throw new ApiError(400, "Payment not completed");
  }

  const transaction = await Transaction.create({
    paymentIntentId,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    userId: user?._id || null,
    bookingId: bookingId || null,
    paidAt: new Date(),
    receiptUrl: paymentIntent.charges?.data?.[0]?.receipt_url || null,
  });

  // Deduct penalty if applicable
  if (user) {
    const paidRupees = transaction.amount / 100;
    await User.findByIdAndUpdate(user._id, {
      $set: {
        penaltyAmount: Math.max(0, (user.penaltyAmount || 0) - paidRupees),
        hasPenalty: ((user.penaltyAmount || 0) - paidRupees) > 0,
      },
    });
  }

  res.json({ success: true, transaction });
});

const getStripeConfig = asyncHandler(async (req, res) => {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY || null;
  console.log('[stripe] getStripeConfig called, hasPublishableKey=', !!publishableKey)
  const isTestKey = publishableKey ? publishableKey.startsWith('pk_test_') : false;
  res.json({
    publishableKey,
    isTestKey,
    currency: DEFAULT_CURRENCY,
  });
});

export { createPaymentIntent, createTransaction, getStripeConfig };
