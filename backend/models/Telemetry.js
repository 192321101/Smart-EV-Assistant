import mongoose from 'mongoose';

const telemetrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  batteryPercent: { type: Number, required: true },
  range_km: { type: Number, required: true },
  speed_kmh: { type: Number, default: 0 },
  isCharging: { type: Boolean, default: false },
  estimatedChargeTime_mins: { type: Number, default: 0 },
  powerDraw_kW: { type: Number, default: 0 },
  temperature_c: { type: Number, default: 25 },
  location: {
    type: { type: String, default: 'Point', enum: ['Point'] },
    coordinates: { type: [Number], default: [72.8777, 19.0760] } // [long, lat]
  }
}, {
  timestamps: true
});

const Telemetry = mongoose.model('Telemetry', telemetrySchema);
export default Telemetry;
