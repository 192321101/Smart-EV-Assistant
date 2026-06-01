import mongoose from 'mongoose';

const savedLocationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  coordinates: { type: [Number], required: true }, // [longitude, latitude]
  isFavorite: { type: Boolean, default: false },
  type: { type: String, enum: ['destination', 'favorite', 'landmark', 'city'], default: 'destination' }
}, {
  timestamps: true
});

// Spatial index for coordinates
savedLocationSchema.index({ coordinates: '2dsphere' });

const SavedLocation = mongoose.model('SavedLocation', savedLocationSchema);
export default SavedLocation;
