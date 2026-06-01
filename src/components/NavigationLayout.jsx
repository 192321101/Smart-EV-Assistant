import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVehicles } from '../context/VehicleContext';
import {
  LayoutDashboard,
  Map,
  BatteryCharging,
  Mic,
  CalendarDays,
  AlertOctagon,
  Users,
  ShieldAlert,
  LineChart,
  Settings,
  LogOut,
  Menu,
  X,
  Coins,
  ChevronDown,
  CloudLightning
} from 'lucide-react';

export default function NavigationLayout({ children }) {
  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { vehicles, activeVehicle, selectActiveVehicle } = useVehicles();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vehicleMenuOpen, setVehicleMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, color: 'text-sky-500' },
    { name: 'Navigation Map', path: '/navigation', icon: Map, color: 'text-indigo-500' },
    { name: 'Charging Stations', path: '/stations', icon: BatteryCharging, color: 'text-emerald-500' },
    { name: 'AI Voice Assistant', path: '/voice', icon: Mic, color: 'text-purple-500' },
    { name: 'Slot Bookings', path: '/booking', icon: CalendarDays, color: 'text-pink-500' },
    { name: 'Weather Alerts', path: '/weather', icon: CloudLightning, color: 'text-amber-500' },
    { name: 'Cost Optimizer', path: '/cost-optimizer', icon: Coins, color: 'text-amber-600' },
    { name: 'Community Forum', path: '/community', icon: Users, color: 'text-teal-500' },
    { name: 'Energy Analytics', path: '/analytics', icon: LineChart, color: 'text-violet-500' },
    { name: 'Settings', path: '/settings', icon: Settings, color: 'text-slate-500' },
  ];

  // Flashing Emergency SOS navigation item (seperated visually)
  const handleSOS = () => {
    navigate('/sos');
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <div className="min-h-screen bg-cyber-gradient flex">
      {/* 1. Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white/70 backdrop-blur-md border-r border-slate-200/50 p-4 fixed h-full z-20">
        <div className="flex items-center gap-2 px-2 py-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-emerald-400 flex items-center justify-center shadow-glow-primary">
            <BatteryCharging className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-slate-800 tracking-tight leading-none">Smart EV</h1>
            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Assistant</span>
          </div>
        </div>

        {/* User Stats Card */}
        {user && (
          <div className="mb-6 p-3 bg-gradient-to-r from-sky-50 to-indigo-50 rounded-2xl border border-sky-100 flex items-center gap-3">
            {user.profileImage ? (
              <img
                src={user.profileImage.startsWith('http') ? user.profileImage : `${BACKEND_URL}${user.profileImage}`}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover shadow-md border border-indigo-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
              <div className="flex items-center gap-1 mt-0.5 text-xs font-bold text-indigo-600">
                <Coins className="w-3.5 h-3.5 text-warning" />
                <span>{user.points || 0} Coins</span>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Nav Items */}
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.color}`} />
                <span>{item.name}</span>
              </button>
            );
          })}

          {/* Admin Dashboard */}
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                location.pathname === '/admin'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                  : 'text-purple-600 hover:bg-purple-50 hover:text-purple-900'
              }`}
            >
              <ShieldAlert className="w-5 h-5 text-purple-500" />
              <span>Admin Terminal</span>
            </button>
          )}
        </nav>

        {/* SOS Dispatch Button */}
        <button
          onClick={handleSOS}
          className="mt-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-rose-500/30 hover:opacity-95 transition-all duration-300 animate-pulse mb-2"
        >
          <AlertOctagon className="w-5 h-5" />
          <span>EMERGENCY SOS</span>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-all duration-300"
        >
          <LogOut className="w-5 h-5 text-rose-500" />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* 2. Main Content Layout (Responsive Header + Router Mount) */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Navigation Top Header */}
        <header className="bg-white/70 backdrop-blur-md border-b border-slate-200/50 h-16 px-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl"
            >
              <Menu className="w-6 h-6 text-slate-700" />
            </button>
            <div className="hidden lg:block">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Welcome Back</span>
              <h2 className="text-lg font-bold text-slate-800 leading-none mt-0.5">
                {user ? user.name : 'EV Driver'}
              </h2>
            </div>
            <div className="lg:hidden flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-400 to-emerald-400 flex items-center justify-center shadow-md">
                <BatteryCharging className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-sm text-slate-800 tracking-tight">Smart EV</span>
            </div>
          </div>

          {/* Active Vehicle Picker & Points */}
          <div className="flex items-center gap-3">
            {/* Active Vehicle Dropdown */}
            {activeVehicle && (
              <div className="relative">
                <button
                  onClick={() => setVehicleMenuOpen(!vehicleMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: activeVehicle.color || '#0ea5e9' }}
                  />
                  <span>{activeVehicle.name} ({activeVehicle.currentCharge_percent}%)</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {vehicleMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 px-3 py-1">
                      Switch Vehicle
                    </p>
                    {vehicles.map((v) => (
                      <button
                        key={v._id}
                        onClick={() => {
                          selectActiveVehicle(v._id);
                          setVehicleMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 ${
                          v._id === activeVehicle._id ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600'
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
                        <span className="flex-1 truncate">{v.name}</span>
                        <span className="text-[10px] text-slate-400">{v.currentCharge_percent}%</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mobile Points counter */}
            <div className="lg:hidden flex items-center gap-1 bg-gradient-to-r from-amber-500/10 to-warning/20 border border-warning/30 px-2.5 py-1 rounded-xl text-xs font-extrabold text-amber-700">
              <Coins className="w-3.5 h-3.5" />
              <span>{user?.points || 0}</span>
            </div>
          </div>
        </header>

        {/* View Layout Mount */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* 3. Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-64 max-w-sm bg-white h-full p-4 z-40 animate-fade-in-right">
            <div className="flex items-center justify-between px-2 py-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-400 to-emerald-400 flex items-center justify-center shadow-md">
                  <BatteryCharging className="w-5 h-5 text-white" />
                </div>
                <h1 className="font-extrabold text-base text-slate-800">Smart EV</h1>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* User details */}
            {user && (
              <div className="mb-4 p-3 bg-gradient-to-r from-sky-50 to-indigo-50 rounded-xl flex items-center gap-3">
                {user.profileImage ? (
                  <img
                    src={user.profileImage.startsWith('http') ? user.profileImage : `${BACKEND_URL}${user.profileImage}`}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover shadow-md border border-indigo-200"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600">
                    <Coins className="w-3 text-warning" />
                    <span>{user.points || 0} Coins</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation links */}
            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : item.color}`} />
                    <span>{item.name}</span>
                  </button>
                );
              })}

              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    navigate('/admin');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    location.pathname === '/admin' ? 'bg-purple-600 text-white' : 'text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <ShieldAlert className="w-4.5 h-4.5" />
                  <span>Admin Terminal</span>
                </button>
              )}
            </nav>

            {/* Emergency SOS Button */}
            <button
              onClick={handleSOS}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold py-2.5 rounded-lg shadow-md hover:opacity-95 transition-all animate-pulse mb-2 text-xs"
            >
              <AlertOctagon className="w-4.5 h-4.5" />
              <span>EMERGENCY SOS</span>
            </button>

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all"
            >
              <LogOut className="w-4.5 h-4.5 text-rose-500" />
              <span>Sign Out</span>
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
