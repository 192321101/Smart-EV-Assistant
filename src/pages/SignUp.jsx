import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, ShieldAlert, Sparkles, KeyRound, Phone, Car, Shield } from 'lucide-react';

export default function SignUp() {
  const navigate = useNavigate();
  const { register, verifyOtp } = useAuth();
  
  // Registration States
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'driver', evModel: '4 Wheeler', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // OTP Verification States
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');

  const validateForm = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = 'Full Name is required';
    if (!formData.email.trim()) {
      tempErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Invalid email address';
    }
    if (!formData.phone.trim()) {
      tempErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,14}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      tempErrors.phone = 'Invalid phone number (e.g. +919876543210)';
    }
    if (formData.role === 'driver' && !formData.evModel.trim()) {
      tempErrors.evModel = 'Vehicle Type selection is required';
    }
    if (formData.password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    const res = await register(formData.name, formData.email, formData.password, formData.phone, formData.evModel, formData.role);
    setLoading(false);
    
    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrors({ server: res.error || 'Signup failed. Please try again.' });
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      setOtpError('Please enter a valid OTP code');
      return;
    }
    
    setLoading(true);
    setOtpError('');
    const res = await verifyOtp(formData.email, otpCode);
    setLoading(false);
    
    if (res.success) {
      navigate('/dashboard');
    } else {
      setOtpError(res.error || 'Invalid OTP code. Try mock code 123456');
    }
  };

  return (
    <div className="min-h-screen bg-cyber-gradient flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-sky-200/50 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-200/50 rounded-full blur-3xl" />

      <AnimatePresence mode="wait">
        {!otpStep ? (
          /* Step A: Signup Form */
          <motion.div
            key="signup-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/60 p-6 md:p-8 shadow-cyber z-10"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                {formData.role === 'driver' && 'Create Driver Profile'}
                {formData.role === 'station_operator' && 'Create Operator Profile'}
                {formData.role === 'admin' && 'Create Admin Profile'}
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                {formData.role === 'driver' && 'Unlock live telemetry and booking slots'}
                {formData.role === 'station_operator' && 'Manage charging hub operations and slots'}
                {formData.role === 'admin' && 'Supervise charging nodes and grid status'}
              </p>
            </div>

            {errors.server && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-semibold">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errors.server}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Alex Driver"
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200/80 rounded-xl text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-semibold"
                  />
                </div>
                {errors.name && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.name}</p>}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="driver@ev.app"
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200/80 rounded-xl text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-semibold"
                  />
                </div>
                {errors.email && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.email}</p>}
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+919876543210"
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200/80 rounded-xl text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-semibold text-slate-800"
                  />
                </div>
                {errors.phone && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.phone}</p>}
              </div>

              {/* Profile Role Select Field */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Register As</label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200/80 rounded-xl text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-semibold text-slate-800"
                  >
                    <option value="driver">Driver</option>
                    <option value="station_operator">Station Operator</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
              </div>

              {/* Vehicle Type Field (Only visible for Driver role) */}
              <AnimatePresence>
                {formData.role === 'driver' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-1 pb-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Vehicle Type</label>
                      <div className="relative">
                        <Car className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                        <select
                          value={formData.evModel}
                          onChange={(e) => setFormData({ ...formData, evModel: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200/80 rounded-xl text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-semibold text-slate-800"
                        >
                          <option value="2 Wheeler">2 Wheeler</option>
                          <option value="3 Wheeler">3 Wheeler</option>
                          <option value="4 Wheeler">4 Wheeler</option>
                        </select>
                      </div>
                      {errors.evModel && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.evModel}</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200/80 rounded-xl text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-semibold"
                  />
                </div>
                {errors.password && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200/80 rounded-xl text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-semibold"
                  />
                </div>
                {errors.confirmPassword && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-500/20 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? 'Creating Matrix...' : 'Sign Up Profile'}
              </button>
            </form>

            <div className="text-center mt-6">
              <span className="text-xs font-bold text-slate-400">Already registered? </span>
              <button
                onClick={() => navigate('/signin')}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Login here
              </button>
            </div>
          </motion.div>
        ) : (
          /* Step B: OTP Verification Modal */
          <motion.div
            key="otp-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl border border-sky-200/50 p-6 md:p-8 shadow-cyber z-10"
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-indigo-600">
                <KeyRound className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Security Check</h2>
              <p className="text-xs font-semibold text-slate-400 mt-1 max-w-xs mx-auto">
                We sent a validation code to <strong className="text-slate-600">{formData.email}</strong>
              </p>
            </div>

            {otpError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-semibold">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 text-center">
                  Verification Code (OTP)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.6em] text-lg font-bold py-3 bg-white/50 border border-slate-200/80 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-lg hover:opacity-95 transition-all flex items-center justify-center"
              >
                {loading ? 'Verifying Code...' : 'Authorize Login'}
              </button>
            </form>

            <div className="text-center mt-6 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Dummy Testing Secret: use code <strong className="text-indigo-600">123456</strong>
              </span>
              <button
                type="button"
                onClick={() => setOtpStep(false)}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 mt-2"
              >
                Back to Registration
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
