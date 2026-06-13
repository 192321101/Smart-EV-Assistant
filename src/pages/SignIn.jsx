import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ShieldAlert, KeyRound, User, Sparkles, Shield } from 'lucide-react';

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const tempErrors = {};
    if (!email.trim()) {
      tempErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Invalid email format';
    }
    if (!password.trim()) {
      tempErrors.password = 'Password is required';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrors({ server: res.error || 'Authentication failed' });
    }
  };

  // Quick DEMO login fills
  const handleQuickLogin = (role) => {
    if (role === 'driver') {
      setEmail('test1@ev.app');
      setPassword('Test@1234');
    } else if (role === 'admin') {
      setEmail('admin@ev.app');
      setPassword('Admin@1234');
    } else if (role === 'operator') {
      setEmail('operator@ev.app');
      setPassword('Operator@1234');
    }
  };

  return (
    <div className="min-h-screen bg-cyber-gradient flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-sky-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 bg-purple-200/40 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/60 p-6 md:p-8 shadow-cyber z-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Driver Gateway</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">Access telemetry dashboard and charging slots</p>
        </div>

        {errors.server && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errors.server}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
              <input
                id="email"
                name="email"
                data-testid="email-input"
                aria-label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="driver@ev.app"
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200/80 rounded-xl text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-semibold"
              />
            </div>
            {errors.email && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.email}</p>}
          </div>

          {/* Password input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
              <button
                id="forgot-password-btn"
                name="forgot-password"
                data-testid="forgot-password-button"
                aria-label="Forgot Password"
                role="button"
                type="button"
                className="text-[10px] font-bold text-indigo-600 hover:underline"
                onClick={() => alert('Demo account passwords are: Driver: Test@1234, Admin: Admin@1234, Operator: Operator@1234')}
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
              <input
                id="password"
                name="password"
                data-testid="password-input"
                aria-label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200/80 rounded-xl text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-semibold"
              />
            </div>
            {errors.password && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.password}</p>}
          </div>

          <button
            id="login-btn"
            name="login-btn"
            data-testid="login-button"
            aria-label="Sign In"
            role="button"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-500/20 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Decrypting Nodes...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Credentials Panel */}
        <div className="mt-6 pt-5 border-t border-slate-200/50">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3 text-center flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
            <span>Fast-Pass Demo Portals</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              id="demo-driver-btn"
              name="demo-driver-btn"
              data-testid="demo-driver-button"
              aria-label="Demo Driver"
              role="button"
              onClick={() => handleQuickLogin('driver')}
              className="px-2 py-2 bg-sky-50 hover:bg-sky-100/80 border border-sky-100 rounded-xl text-[10px] font-bold text-sky-700 transition-colors flex items-center justify-center gap-1"
            >
              <User className="w-3.5 h-3.5" />
              <span>Driver</span>
            </button>
            <button
              id="demo-operator-btn"
              name="demo-operator-btn"
              data-testid="demo-operator-button"
              aria-label="Demo Operator"
              role="button"
              onClick={() => handleQuickLogin('operator')}
              className="px-2 py-2 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100 rounded-xl text-[10px] font-bold text-emerald-700 transition-colors flex items-center justify-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Operator</span>
            </button>
            <button
              id="demo-admin-btn"
              name="demo-admin-btn"
              data-testid="demo-admin-button"
              aria-label="Demo Admin"
              role="button"
              onClick={() => handleQuickLogin('admin')}
              className="px-2 py-2 bg-purple-50 hover:bg-purple-100/80 border border-purple-100 rounded-xl text-[10px] font-bold text-purple-700 transition-colors flex items-center justify-center gap-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <span className="text-xs font-bold text-slate-400">New driver profile? </span>
          <button
            onClick={() => navigate('/signup')}
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            Create account
          </button>
        </div>
      </div>
    </div>
  );
}
