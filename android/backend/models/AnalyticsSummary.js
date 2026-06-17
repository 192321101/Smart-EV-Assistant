import mongoose from 'mongoose';

const analyticsSummarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  totalKwh: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  totalCo2Saved: { type: Number, default: 0 },
  avgEfficiency_whKm: { type: Number, default: 165 }, // average driving energy consumption (Wh/km)
  sessionsCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

const AnalyticsSummary = mongoose.model('AnalyticsSummary', analyticsSummarySchema);
export default AnalyticsSummary;
