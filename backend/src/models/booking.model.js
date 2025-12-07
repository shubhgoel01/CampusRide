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
    startLocationName: {
        type: String,
        trim: true
    },
    endLocation: {
        type: pointSchema,
        required: true
    },
    endLocationName: {
        type: String,
        trim: true
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
        enum: ["pending", "returned", "completed", "canceled"],
        default: "pending"
    },
    receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    receivedAt: {
        type: Date,
        required: false
    },
    estimatedDistance: Number,
    duration: Number
}, { timestamps: true });

export const Booking = mongoose.model("Booking", bookingSchema);