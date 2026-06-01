import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BatteryCharging } from 'lucide-react';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/welcome');
    }, 3200);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Glow Backdrops */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-sky-500/10 rounded-full blur-[100px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] animate-pulse-slow" />

      {/* Futuristic Orbit Ring */}
      <motion.div
        initial={{ rotate: 0, scale: 0.8, opacity: 0 }}
        animate={{ rotate: 360, scale: 1, opacity: 1 }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
        className="absolute w-72 h-72 rounded-full border border-sky-500/20 border-t-sky-400 border-r-transparent animate-spin-slow flex items-center justify-center"
      />

      <motion.div
        initial={{ rotate: 180, scale: 0.9, opacity: 0 }}
        animate={{ rotate: -180, scale: 1, opacity: 1 }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
        className="absolute w-60 h-60 rounded-full border border-purple-500/10 border-b-purple-400 border-l-transparent animate-spin-slow"
      />

      <div className="flex flex-col items-center z-10">
        {/* Holographic Glowing Icon */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 80 }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-sky-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-sky-500/40 relative mb-6"
        >
          <BatteryCharging className="w-12 h-12 text-white animate-bounce" />
          {/* Internal Spark Lines */}
          <div className="absolute inset-0 rounded-3xl border border-white/30 animate-pulse" />
        </motion.div>

        {/* Brand Text */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-4xl font-extrabold text-white tracking-tight leading-none font-sans"
        >
          Smart EV
        </motion.h1>
        
        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-xs font-bold text-sky-400 uppercase tracking-[0.4em] mt-2"
        >
          Assistant System
        </motion.p>
      </div>

      {/* Bottom Telemetry Loading bar */}
      <div className="absolute bottom-16 w-52 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ left: '-100%' }}
          animate={{ left: '100%' }}
          transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity }}
          className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-sky-400 to-emerald-400"
        />
      </div>
      
      <div className="absolute bottom-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        Version 2.0.4.Beta
      </div>
    </div>
  );
}
