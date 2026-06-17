import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stationId: { type: String, required: true }, // Store as string to support both mock string IDs and Mongoose ObjectIds
  slotId: { type: String, required: true },
  scheduledTime: { type: Date, required: true },
  duration_min: { type: Number, required: true },
  status: { type: String, default: 'active', enum: ['active', 'cancelled', 'completed'] },
  vehicleId: { type: String, required: true },
  paymentId: { type: String, required: true }
}, {
  timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
