import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Prevent duplicate locations
    trim: true,
    lowercase: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  }
}, {
  timestamps: true
});

locationSchema.index({ coordinates: '2dsphere' }); // Optional, for future geospatial queries

export const Location = mongoose.model('Location', locationSchema);