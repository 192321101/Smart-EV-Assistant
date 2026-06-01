import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BatteryCharging, Compass, Mic, Coins, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Real-time Battery Telemetry',
      description: 'Stream live SoC percentages, temperature draw, and current consumption metrics using high-frequency WebSockets.',
      icon: BatteryCharging,
      color: 'from-sky-400 to-indigo-500 shadow-sky-500/20',
      label: 'TELEMETRY'
    },
    {
      title: 'Smart Routes & Slot Reservations',
      description: 'Find and lock optimal charging slots on long highway routes, with automated billing and digital invoice generation.',
      icon: Compass,
      color: 'from-indigo-500 to-purple-500 shadow-indigo-500/20',
      label: 'NAVIGATION'
    },
    {
      title: 'AI Voice Autopilot Assistance',
      description: 'Speak naturally to trigger SOS hazards, look up charging hubs, check battery ranges, and customize settings.',
      icon: Mic,
      color: 'from-purple-500 to-pink-500 shadow-purple-500/20',
      label: 'VOICE AI'
    },
    {
      title: 'Earn Carbon Coins & Level Up',
      description: 'Earn loyalty points for choosing clean charging methods. Redeem rewards, gain badges, and share stories with the community.',
      icon: Coins,
      color: 'from-emerald-400 to-teal-500 shadow-emerald-500/20',
      label: 'ECO REWARDS'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      navigate('/signup');
    }
  };

  const handleSkip = () => {
    navigate('/signup');
  };

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="min-h-screen bg-cyber-gradient flex flex-col justify-between p-6">
      {/* Top Header Controls */}
      <header className="flex justify-between items-center w-full max-w-xl mx-auto">
        <span className="text-xs font-bold text-slate-400">Onboarding — Step {currentStep + 1} of {steps.length}</span>
        <button
          onClick={handleSkip}
          className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider"
        >
          Skip
        </button>
      </header>

      {/* Main Interactive Stage */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full flex flex-col items-center text-center"
          >
            {/* Pulsating Glowing Icon Circle */}
            <div className={`w-28 h-28 rounded-3xl bg-gradient-to-tr ${steps[currentStep].color} flex items-center justify-center text-white shadow-xl mb-8 animate-float`}>
              <StepIcon className="w-12 h-12" />
            </div>

            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-4">
              {steps[currentStep].label}
            </span>

            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-4">
              {steps[currentStep].title}
            </h2>

            <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-sm">
              {steps[currentStep].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Page Progress Control HUD */}
      <footer className="w-full max-w-xl mx-auto flex items-center justify-between mt-auto">
        {/* Navigation Indicator Dots */}
        <div className="flex gap-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                idx === currentStep ? 'w-6 bg-indigo-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all"
        >
          <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
}
