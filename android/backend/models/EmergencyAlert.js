import mongoose from 'mongoose';

const emergencyAlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'active', enum: ['active', 'cancelled'] },
  location: {
    type: { type: String, default: 'Point', enum: ['Point'] },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  message: { type: String, default: 'Vehicle breakdown alert. Requiring roadside power rescue.' },
  responderDetails: {
    unitId: { type: String, default: 'EcoTow-#412' },
    eta_mins: { type: Number, default: 14 },
    name: { type: String, default: 'Officer Rajesh Kumar' }
  }
}, {
  timestamps: true
});

const EmergencyAlert = mongoose.model('EmergencyAlert', emergencyAlertSchema);
export default EmergencyAlert;
