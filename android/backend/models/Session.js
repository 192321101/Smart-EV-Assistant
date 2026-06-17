import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleId: { type: String, required: true },
  stationId: { type: String, required: true },
  slotId: { type: String, required: true },
  status: { type: String, default: 'active', enum: ['active', 'completed'] },
  start_time: { type: Date, default: Date.now },
  end_time: { type: Date },
  energy_delivered_kwh: { type: Number, default: 0 },
  total_cost: { type: Number, default: 0 }
}, {
  timestamps: true
});

const Session = mongoose.model('Session', sessionSchema);
export default Session;
