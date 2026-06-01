import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVehicles } from '../context/VehicleContext';
import { useTelemetry } from '../context/TelemetryContext';
import api from '../services/api';
import {
  Zap,
  Battery,
  Compass,
  Coins,
  AlertTriangle,
  Play,
  Square,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Flame,
  Award
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeVehicle } = useVehicles();
  const { 
    activeSession, 
    telemetry, 
    stopChargingSession, 
    resetSession,
    isDriving,
    drivingTelemetry,
    startDrivingSim,
    stopDrivingSim,
    telemetryState,
    loading: telemetryLoading,
    error: telemetryError
  } = useTelemetry();

  const [simSpeed, setSimSpeed] = React.useState(80);
  const [simHvac, setSimHvac] = React.useState(false);
  const [simTerrain, setSimTerrain] = React.useState('flat');

  const [nearbyStations, setNearbyStations] = React.useState([]);
  const [stationsLoading, setStationsLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    const fetchStations = async () => {
      try {
        setStationsLoading(true);
        const res = await api.get('/stations/nearby');
        if (res.data.success && active) {
          setNearbyStations(res.data.stations.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch stations:', err);
      } finally {
        if (active) setStationsLoading(false);
      }
    };

    fetchStations();
    return () => {
      active = false;
    };
  }, []);

  const [notifications, setNotifications] = React.useState([]);

  React.useEffect(() => {
    let active = true;
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data.success && active) {
          const formatted = res.data.notifications.map(n => ({
            id: n._id || n.id,
            title: n.title,
            message: n.body,
            time: formatTimeAgo(n.createdAt),
            type: mapNotifType(n.type)
          }));
          setNotifications(formatted);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err.message);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  function formatTimeAgo(dateString) {
    if (!dateString) return 'Just now';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  function mapNotifType(type) {
    switch (type) {
      case 'charge_full':
        return 'success';
      case 'charge_low':
        return 'warning';
      case 'booking':
        return 'info';
      case 'promo':
        return 'success';
      default:
        return 'info';
    }
  }

  if (telemetryLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-extrabold text-indigo-600 animate-pulse uppercase tracking-wider">Syncing Telemetry Node...</p>
      </div>
    );
  }

  if (telemetryError) {
    return (
      <div className="glass-panel p-6 max-w-md mx-auto rounded-3xl border border-rose-200/50 text-center space-y-4 mt-12">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto animate-bounce" />
        <h3 className="text-lg font-black text-slate-800">Connection Interrupted</h3>
        <p className="text-xs font-semibold text-slate-500 leading-relaxed">{telemetryError}</p>
        <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors">
          Retry Sync
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Hero Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">System Telemetry</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Active Node: {activeVehicle ? `${activeVehicle.brand} ${activeVehicle.model}` : 'No Connected EV'}
          </p>
        </div>
        
        {/* Dynamic Telemetry Status Tag */}
        <div className="flex items-center gap-2">
          {telemetryState.isCharging || activeSession ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Session Charging ({telemetryState.powerDraw_kW || telemetry.powerDraw_kW} kW)</span>
            </span>
          ) : telemetryState.speed_kmh > 0 ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md animate-pulse">
              <Compass className="w-3.5 h-3.5 fill-white animate-spin" />
              <span>Driving ({telemetryState.speed_kmh} km/h)</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-600 rounded-xl text-xs font-bold">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Standby Mode</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Core Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card A: Battery State of Charge (SoC) */}
        <div className="glass-panel-neon p-6 rounded-3xl border border-sky-200/50 flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full">
                Battery SoC
              </span>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-3">
                {telemetryState ? telemetryState.batteryPercent : (activeVehicle ? activeVehicle.currentCharge_percent : 0)}%
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                {activeVehicle ? `${(activeVehicle.batteryCapacity_kWh * ((telemetryState ? telemetryState.batteryPercent : activeVehicle.currentCharge_percent) / 100)).toFixed(1)} / ${activeVehicle.batteryCapacity_kWh} kWh` : '0 kWh'}
              </p>
            </div>
            <div className="p-3 bg-sky-100 rounded-2xl text-sky-600">
              <Battery className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          {/* Battery level fill simulator bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1.5">
              <span>Remaining Charge</span>
              <span>{telemetryState ? telemetryState.batteryPercent : (activeVehicle ? activeVehicle.currentCharge_percent : 0)}%</span>
            </div>
            <div className="w-full h-3.5 bg-slate-200/60 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-sky-400 transition-all duration-500"
                style={{ width: `${telemetryState ? telemetryState.batteryPercent : (activeVehicle ? activeVehicle.currentCharge_percent : 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card B: Projected Driving Range */}
        <div className="glass-panel-purple p-6 rounded-3xl border border-purple-200/50 flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
                Driving Range
              </span>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-3">
                {telemetryState ? telemetryState.range_km : (activeVehicle ? activeVehicle.range_km : 0)} <span className="text-sm font-bold text-slate-400">km</span>
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">Calculated via active SoC and driving profile</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-2xl text-purple-600">
              <Compass className="w-6 h-6" />
            </div>
          </div>

          <button
            onClick={() => navigate('/navigation')}
            className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-purple-100 mt-6"
          >
            <span>Launch Range Mapping</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card C: Carbon Points Loyalty */}
        <div className="glass-panel p-6 rounded-3xl border border-emerald-200/40 flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                Eco Contribution
              </span>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-3 flex items-center gap-2">
                <Coins className="w-7 h-7 text-warning animate-bounce" />
                <span>{user ? user.points : 0}</span>
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">Level 4: Green Voyager</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
              <Award className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1"><Flame className="w-4 h-4 text-orange-500" /> 12 Day Streak</span>
            <button
              onClick={() => navigate('/community')}
              className="text-indigo-600 hover:underline"
            >
              Redeem Rewards
            </button>
          </div>
        </div>
      </div>

      {/* Driving Simulation Control Panel */}
      {activeVehicle && !activeSession && (
        <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50 text-left space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                Active Driving Simulator
              </span>
              <h3 className="text-lg font-extrabold text-slate-800 mt-2">Dynamic Battery Drain Test</h3>
            </div>
            
            {isDriving ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500 text-white rounded-xl text-[10px] font-extrabold shadow-md animate-pulse">
                <Play className="w-3 h-3 fill-white" />
                <span>DRIVING LIVE</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-extrabold">
                <span>SIM READY</span>
              </span>
            )}
          </div>

          {isDriving && drivingTelemetry ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Speed</span>
                <span className="text-lg font-black text-indigo-600">{drivingTelemetry.speed} km/h</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Distance Added</span>
                <span className="text-lg font-black text-indigo-600">+{drivingTelemetry.odometer_delta_km} km</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Energy Drawn</span>
                <span className="text-lg font-black text-rose-500">{drivingTelemetry.energyDrawn_kWh} kWh</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Est. Range Left</span>
                <span className="text-lg font-black text-emerald-600">{drivingTelemetry.range_km} km</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Simulation Speed</label>
                <select
                  value={simSpeed}
                  onChange={(e) => setSimSpeed(Number(e.target.value))}
                  className="w-full py-2 px-3 bg-white/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value={60}>Eco Cruise (60 km/h)</option>
                  <option value={80}>Standard Highway (80 km/h)</option>
                  <option value={100}>High Speed (100 km/h — Heavy Penalty)</option>
                  <option value={120}>Extreme Speed (120 km/h — Critical Penalty)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">HVAC Air Conditioner</label>
                <select
                  value={simHvac ? 'on' : 'off'}
                  onChange={(e) => setSimHvac(e.target.value === 'on')}
                  className="w-full py-2 px-3 bg-white/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="off">AC Disabled</option>
                  <option value="on">AC Active (-10% range)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Route Conditions</label>
                <select
                  value={simTerrain}
                  onChange={(e) => setSimTerrain(e.target.value)}
                  className="w-full py-2 px-3 bg-white/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="flat">Flat Highway Roads</option>
                  <option value="hilly">Hilly Incline Slopes (-15% range)</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            {isDriving ? (
              <button
                onClick={() => stopDrivingSim(activeVehicle._id)}
                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Stop Simulator</span>
              </button>
            ) : (
              <button
                onClick={() => startDrivingSim(activeVehicle._id, simSpeed, simHvac, simTerrain)}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:opacity-95"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Driving Sim</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Live WebSocket Charging Console (Renders when charging session is active) */}
      {activeSession && (
        <div className="p-5 md:p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          {/* Animated Glow Grid backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.15),transparent_60%)] pointer-events-none" />
          
          <div className="flex-1 space-y-4 z-10 w-full">
            <div>
              <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest bg-sky-950 border border-sky-850 px-2 py-0.5 rounded-full">
                Live Telemetry Connection
              </span>
              <h2 className="text-xl font-extrabold mt-2 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Charging in Progress</span>
              </h2>
            </div>

            {/* Metrics stats row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Power Draw</span>
                <p className="text-lg font-black text-sky-400 mt-1">{telemetryState.powerDraw_kW || telemetry.powerDraw_kW} kW</p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transferred</span>
                <p className="text-lg font-black text-emerald-400 mt-1">{telemetry.kwhCharged} kWh</p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Elapsed Time</span>
                <p className="text-lg font-black text-purple-400 mt-1">
                  {Math.floor(telemetry.elapsedSeconds / 60)}m {telemetry.elapsedSeconds % 60}s
                </p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Charging ETA</span>
                <p className="text-lg font-black text-pink-400 mt-1">
                  {telemetryState.estimatedChargeTime_mins > 0 ? `${telemetryState.estimatedChargeTime_mins} mins` : 'Calculating...'}
                </p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Cost</span>
                <p className="text-lg font-black text-yellow-400 mt-1">₹ {telemetry.totalCost}</p>
              </div>
            </div>
          </div>

          {/* Action trigger button */}
          <div className="z-10 w-full md:w-auto flex flex-col gap-2">
            {activeSession.status === 'active' ? (
              <button
                onClick={stopChargingSession}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Stop Charging</span>
              </button>
            ) : (
              <button
                onClick={resetSession}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-sm rounded-2xl shadow-lg active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Clear session</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. Navigation Shortcuts, Nearby Stations & Notifications Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Navigation Shortcut list */}
        <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50">
          <h3 className="text-base font-bold text-slate-800 mb-4">Quick Command Modules</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/navigation')}
              className="p-4 bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-2xl text-left transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white mb-3">
                <Compass className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 leading-none">Map Navigation</h4>
              <p className="text-[10px] font-bold text-slate-400 mt-1 leading-tight">Route with charge stops</p>
            </button>

            <button
              onClick={() => navigate('/stations')}
              className="p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-2xl text-left transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white mb-3">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 leading-none">Charging Hubs</h4>
              <p className="text-[10px] font-bold text-slate-400 mt-1 leading-tight">Explore nearby slots</p>
            </button>
          </div>
        </div>

        {/* Nearby Charging Hubs */}
        <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50">
          <h3 className="text-base font-bold text-slate-800 mb-4">Nearby Charging Hubs</h3>
          {stationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : nearbyStations.length > 0 ? (
            <div className="space-y-3">
              {nearbyStations.map(station => (
                <div key={station._id} className="p-3 bg-slate-50 border border-slate-200/30 rounded-2xl flex items-center justify-between gap-3 font-sans">
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-slate-800 leading-none">{station.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">{station.location.address}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-extrabold border border-emerald-100">
                        ₹ {station.pricing_per_kWh}/kWh
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold font-sans">★ {station.rating}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/stations')}
                    className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-colors border border-indigo-100"
                  >
                    <Zap className="w-3.5 h-3.5 animate-pulse" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs font-bold text-slate-400 py-8 text-center">No stations found nearby.</p>
          )}
        </div>

        {/* Real-time Alerts feed */}
        <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50">
          <h3 className="text-base font-bold text-slate-800 mb-4">Telemetry Grid Log</h3>
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3 bg-slate-50 border border-slate-200/30 rounded-2xl flex items-start justify-between gap-3 text-left"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-850 text-slate-800 leading-none">{notif.title}</h4>
                  <p className="text-[11px] font-semibold text-slate-500 mt-1 leading-tight">{notif.message}</p>
                </div>
                <span className="text-[9px] font-extrabold text-slate-400 whitespace-nowrap">{notif.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
