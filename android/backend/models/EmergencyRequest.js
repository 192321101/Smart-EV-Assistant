import mongoose from 'mongoose';

const emergencyRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    default: 'dispatched', 
    enum: ['dispatched', 'enroute', 'arrived', 'resolved', 'cancelled'] 
  },
  location: {
    type: { type: String, default: 'Point', enum: ['Point'] },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  message: { type: String, default: 'Vehicle breakdown alert. Requiring roadside power rescue.' },
  contactsNotified: { type: Boolean, default: true },
  responderDetails: {
    unitId: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    eta_mins: { type: Number, required: true },
    location: {
      type: { type: String, default: 'Point', enum: ['Point'] },
      coordinates: { type: [Number], required: true } // [longitude, latitude]
    }
  }
}, {
  timestamps: true
});

const EmergencyRequest = mongoose.model('EmergencyRequest', emergencyRequestSchema);
export default EmergencyRequest;
