import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  power_kW: { type: Number, required: true },
  status: { type: String, default: 'available', enum: ['available', 'occupied'] }
});

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const chargingStationSchema = new mongoose.Schema({
  _id: { type: String },
  name: { type: String, required: true },
  location: {
    type: { type: String, default: 'Point', enum: ['Point'] },
    coordinates: { type: [Number], required: true, index: '2dsphere' }, // [longitude, latitude]
    address: { type: String, required: true }
  },
  operator: { type: String, required: true },
  amenities: { type: [String], default: [] },
  rating: { type: Number, default: 4.5 },
  reviewsCount: { type: Number, default: 0 },
  reviews: { type: [reviewSchema], default: [] },
  pricing_per_kWh: { type: Number, default: 12.0 },
  slots: [slotSchema]
}, {
  timestamps: true
});

const ChargingStation = mongoose.model('ChargingStation', chargingStationSchema);
export default ChargingStation;
