import mongoose from "mongoose";

const transactionSchema = mongoose.Schema(
  {
    paymentIntentId: { type: String, required: true }, // Stripe ID
    amount: { type: Number, required: true }, // in paise
    currency: { type: String, default: "inr" },
    status: {
      type: String,
      enum: ["succeeded", "failed", "processing"],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: false,
    },
    receiptUrl: { type: String }, // Stripe gives this
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);

