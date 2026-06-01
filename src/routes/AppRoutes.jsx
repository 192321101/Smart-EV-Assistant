import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

// Import Pages
import Splash from '../pages/Splash';
import Welcome from '../pages/Welcome';
import Onboarding from '../pages/Onboarding';
import SignUp from '../pages/SignUp';
import SignIn from '../pages/SignIn';
import Dashboard from '../pages/Dashboard';
import Navigation from '../pages/Navigation';
import ChargingStation from '../pages/ChargingStation';
import VoiceAssistant from '../pages/VoiceAssistant';
import Booking from '../pages/Booking';
import EmergencySOS from '../pages/EmergencySOS';
import Community from '../pages/Community';
import AdminDashboard from '../pages/AdminDashboard';
import Analytics from '../pages/Analytics';
import Settings from '../pages/Settings';
import WeatherAlert from '../pages/WeatherAlert';
import CostOptimizer from '../pages/CostOptimizer';

import NavigationLayout from '../components/NavigationLayout';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-gradient flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full border-4 border-t-sky-500 border-r-indigo-500 border-b-emerald-500 border-l-slate-200 animate-spin" />
          <p className="text-sm font-bold text-slate-500 tracking-wider">Syncing Neural Grid...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return <NavigationLayout>{children}</NavigationLayout>;
};

// Route wrapper for animated page transitions
const AnimatedPage = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

export default function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Screens */}
        <Route path="/" element={<Splash />} />
        <Route path="/welcome" element={<AnimatedPage><Welcome /></AnimatedPage>} />
        <Route path="/onboarding" element={<AnimatedPage><Onboarding /></AnimatedPage>} />
        <Route path="/signup" element={<AnimatedPage><SignUp /></AnimatedPage>} />
        <Route path="/signin" element={<AnimatedPage><SignIn /></AnimatedPage>} />

        {/* Private Smart Assistant Modules */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <Dashboard />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/navigation"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <Navigation />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/stations"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <ChargingStation />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/voice"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <VoiceAssistant />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <Booking />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sos"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <EmergencySOS />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <Community />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <AdminDashboard />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <Analytics />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <Settings />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/weather"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <WeatherAlert />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cost-optimizer"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <CostOptimizer />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
