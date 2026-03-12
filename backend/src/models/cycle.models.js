import mongoose from "mongoose";
import { pointSchema } from "./point.schema.js";

const cycleSchema = mongoose.Schema({
  cycleName: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ["available", "booked", "maintenance"],
    default: "available",
  },
  currentLocation: {
    type: pointSchema,
    required: true,
  },
});

// Create a 2dsphere index on currentLocation.coordinates for geospatial queries
cycleSchema.index({ "currentLocation.coordinates": "2dsphere" }); // Optional, for future geospatial queries
cycleSchema.index({ status: 1, cycleName: 1 });
cycleSchema.index({ cycleName: 1 });

//Why used latitude longitude instead of address? : this helps in realtime tracking if implemented in future
export const Cycle = mongoose.model("Cycle", cycleSchema);
