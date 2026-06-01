import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Leaf, Shield, Zap, Sparkles } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();

  const metrics = [
    { value: '45.2M', label: 'Eco Miles Tracked', icon: Leaf, color: 'text-emerald-500 bg-emerald-50' },
    { value: '18.4K', label: 'Tons CO2 Offset', icon: Sparkles, color: 'text-sky-500 bg-sky-50' },
    { value: '250K+', label: 'Active Smart EVs', icon: Zap, color: 'text-purple-500 bg-purple-50' },
  ];

  return (
    <div className="min-h-screen bg-cyber-gradient flex flex-col justify-between p-6 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-purple-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-[-150px] left-[-150px] w-96 h-96 bg-sky-200/40 rounded-full blur-3xl" />

      {/* 1. Welcome Header */}
      <header className="flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-emerald-400 flex items-center justify-center shadow-md">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-slate-800 tracking-tight">Smart EV Assistant</span>
        </div>
        <button
          onClick={() => navigate('/signin')}
          className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          Sign In
        </button>
      </header>

      {/* 2. Hero Center Console */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto text-center z-10 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-100 rounded-full text-xs font-bold text-sky-700 mb-6 border border-sky-200/50"
        >
          <Zap className="w-3.5 h-3.5 fill-sky-700" />
          <span>V2.0 REDESIGNED TELEMETRY</span>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-6xl font-extrabold text-slate-800 tracking-tight leading-[1.1] mb-6"
        >
          Your Intelligent <span className="text-gradient-primary">EV Companion</span> App
        </motion.h1>

        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-slate-500 text-sm md:text-lg max-w-2xl leading-relaxed mb-10"
        >
          Connect, reserve fast slots, and run voice autopilot commands with real-time WebSocket telemetry and advanced ecosystem contribution trackers.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <button
            onClick={() => navigate('/onboarding')}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-sky-500/25 hover:shadow-xl hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-base rounded-2xl shadow border border-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span>Create Account</span>
          </button>
        </motion.div>
      </div>

      {/* 3. Static Live Stats Bar */}
      <footer className="w-full max-w-4xl mx-auto z-10 mt-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.15 }}
                className="glass-panel p-4 rounded-2xl flex items-center gap-4 text-left border border-slate-200/40"
              >
                <div className={`p-3 rounded-xl ${item.color} shadow-sm`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800 leading-none">{item.value}</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">{item.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </footer>
    </div>
  );
}
