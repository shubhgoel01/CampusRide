import mongoose from "mongoose";

const pointSchema = mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  }
}, { _id: false });

const bookingSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    cycleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cycle",
        required: true
    },
    startLocation: {
        type: pointSchema,
        required: true
    },
    endLocation: {
        type: pointSchema,
        required: true
    },
    isRoundTrip: {
        type: Boolean,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    estimatedEndTime: {
        type: Date,
        required: true
    },
    actualEndTime: {
        type: Date,
    },
    penaltyApplied: {
        type: Boolean,
        default: false
    },
    penaltyAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["pending", "completed", "canceled"],
        default: "pending"
    },
    estimatedDistance: Number,
    duration: Number
}, {timestamps: true});

export const Booking = mongoose.model("Booking", bookingSchema);