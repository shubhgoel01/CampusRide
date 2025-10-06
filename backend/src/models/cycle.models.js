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

const cycleSchema = mongoose.Schema({
    cycleName: {
        type: String,
    },
    status: {
        type: String,
        enum: ["available", "booked", "maintenance"],
        default: "available"
    },
    currentLocation: {
        type: pointSchema,
        required: true,
    }
})

// Create a 2dsphere index on currentLocation.coordinates for geospatial queries
cycleSchema.index({ 'currentLocation.coordinates': '2dsphere' }); // Optional, for future geospatial queries

//Why used latitude longitude instead of address? : this helps in realtime tracking if implemented in future
export const Cycle = mongoose.model("Cycle", cycleSchema);