const mongoose = require('mongoose');

/**
 * Enhanced Delivery Schema with ETA calculation support
 * Stores delivery information including distance and estimated time of arrival
 */
const DeliverySchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  
  restaurantLocation: {
    lat: Number,
    lng: Number
  },
  customerLocation: {
    lat: Number,
    lng: Number
  },
  
  distanceKm: { type: Number },
  etaMinutes: { type: Number },
  
  status: {
    type: String,
    enum: ['CONFIRMED', 'PREPARING', 'DELIVERING', 'COMPLETED', 'CANCELLED'],
    default: 'CONFIRMED'
  },
  
  startedAt: Date,
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = { DeliverySchema };
