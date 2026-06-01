import mongoose from 'mongoose';

const voiceLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: String, required: true, enum: ['user', 'assistant'] },
  text: { type: String, required: true }
}, {
  timestamps: true
});

const VoiceLog = mongoose.model('VoiceLog', voiceLogSchema);
export default VoiceLog;
