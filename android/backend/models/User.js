import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  evModel: { type: String },
  role: { type: String, enum: ['driver', 'admin', 'station_operator'], default: 'driver' },
  points: { type: Number, default: 0 },
  tier: { type: String, default: 'bronze' }, // 'gold', 'silver', 'bronze'
  otp: { type: String }, // For verification and forgot-password flows
  otpExpires: { type: Date },
  profileImage: { type: String, default: '' },
  targetCharge: { type: Number, default: 80 },
  allowPush: { type: Boolean, default: true },
  allowSmsAlert: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
