import mongoose from 'mongoose';

const routeHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startName: { type: String, required: true },
  startCoords: { type: [Number], required: true }, // [longitude, latitude]
  destinationName: { type: String, required: true },
  destCoords: { type: [Number], required: true }, // [longitude, latitude]
  distance_km: { type: Number, required: true },
  duration_min: { type: Number, required: true },
  energy_kwh: { type: Number, required: true },
  chargingStops: [{
    stationId: { type: String },
    name: { type: String },
    chargerType: { type: String },
    power_kW: { type: Number }
  }]
}, {
  timestamps: true
});

const RouteHistory = mongoose.model('RouteHistory', routeHistorySchema);
export default RouteHistory;
