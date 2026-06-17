import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  batteryCapacity_kWh: { type: Number, required: true },
  currentCharge_percent: { type: Number, default: 50 },
  range_km: { type: Number, required: true },
  plateNumber: { type: String, default: '' },
  connectorType: { type: String, default: 'CCS' },
  color: { type: String, default: '#0ea5e9' },
  isDefault: { type: Boolean, default: false }
}, {
  timestamps: true
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
