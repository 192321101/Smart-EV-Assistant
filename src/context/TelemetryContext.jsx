import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useVehicles } from './VehicleContext';

const TelemetryContext = createContext(null);

export const TelemetryProvider = ({ children }) => {
  const { token, user } = useAuth();
  const { activeVehicle, updateBatteryTelemetry } = useVehicles();
  
  const [activeSession, setActiveSession] = useState(null);
  const [isDriving, setIsDriving] = useState(false);
  const [drivingTelemetry, setDrivingTelemetry] = useState(null);
  const [telemetry, setTelemetry] = useState({
    chargePercent: 0,
    kwhCharged: 0,
    powerDraw_kW: 0,
    elapsedSeconds: 0,
    totalCost: 0
  });
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [telemetryState, setTelemetryState] = useState({
    batteryPercent: 0,
    range_km: 0,
    speed_kmh: 0,
    isCharging: false,
    estimatedChargeTime_mins: 0,
    powerDraw_kW: 0,
    temperature_c: 25
  });

  // Fetch initial telemetry state from API
  useEffect(() => {
    let active = true;
    const fetchInitialTelemetry = async () => {
      if (!token || !user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await api.get('/telemetry/latest');
        if (res.data.success && active) {
          const t = res.data.telemetry;
          setTelemetryState({
            batteryPercent: t.batteryPercent,
            range_km: t.range_km,
            speed_kmh: t.speed_kmh,
            isCharging: t.isCharging,
            estimatedChargeTime_mins: t.estimatedChargeTime_mins,
            powerDraw_kW: t.powerDraw_kW,
            temperature_c: t.temperature_c
          });
          setError(null);
        }
      } catch (err) {
        console.error('❌ [TelemetryContext] Initial fetch failed:', err.message);
        // Don't throw hard errors, default to vehicle values if possible
        if (activeVehicle) {
          setTelemetryState(prev => ({
            ...prev,
            batteryPercent: activeVehicle.currentCharge_percent || 0,
            range_km: activeVehicle.range_km || 0
          }));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchInitialTelemetry();
    return () => {
      active = false;
    };
  }, [token, user, activeVehicle]);

  // Sync telemetryState with activeVehicle battery updates (e.g. from Voice commands)
  useEffect(() => {
    if (activeVehicle) {
      setTelemetryState(prev => ({
        ...prev,
        batteryPercent: activeVehicle.currentCharge_percent,
        range_km: activeVehicle.range_km
      }));
    }
  }, [activeVehicle?.currentCharge_percent, activeVehicle?.range_km]);

  const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // 1. Manage WebSocket Connection & JWT Auths
  useEffect(() => {
    if (!token || !user || token.startsWith('mock_jwt_token')) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    console.log('📡 [Telemetry WS] Initializing socket handshake...');
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false
    });

    newSocket.connect();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🔌 [Telemetry WS] Connected to live streaming service.');
    });

    newSocket.on('session:update', (data) => {
      setTelemetry({
        chargePercent: data.currentCharge,
        kwhCharged: data.energyDelivered,
        powerDraw_kW: data.powerDraw,
        elapsedSeconds: data.timeElapsed,
        totalCost: data.cost
      });
      setTelemetryState(prev => ({
        ...prev,
        batteryPercent: data.currentCharge,
        isCharging: true,
        powerDraw_kW: data.powerDraw,
        estimatedChargeTime_mins: data.estimatedChargeTime_mins || 0,
        speed_kmh: 0
      }));
      // Synchronize vehicle SoC in garage context
      updateBatteryTelemetry(data.currentCharge);
    });

    newSocket.on('vehicle:telemetry', (data) => {
      setDrivingTelemetry(data);
      setTelemetryState(prev => ({
        ...prev,
        batteryPercent: data.currentCharge,
        range_km: data.range_km,
        speed_kmh: data.speed,
        isCharging: false,
        powerDraw_kW: 0,
        estimatedChargeTime_mins: 0
      }));
      // Update battery context
      updateBatteryTelemetry(data.currentCharge);
    });

    newSocket.on('charge:low', (data) => {
      console.warn('⚠️ [Telemetry WS] Low Battery Warn:', data.message);
    });

    newSocket.on('driving:stopped', (data) => {
      setIsDriving(false);
      setDrivingTelemetry(null);
      setTelemetryState(prev => ({
        ...prev,
        speed_kmh: 0,
        isCharging: false
      }));
      console.log('🚗 [Telemetry WS] Driving simulation ended:', data.reason);
    });

    newSocket.on('charge:full', () => {
      console.log('🔋 [Telemetry WS] Charge complete!');
      setTelemetryState(prev => ({
        ...prev,
        batteryPercent: 100,
        isCharging: false,
        powerDraw_kW: 0,
        estimatedChargeTime_mins: 0
      }));
      alert('Your vehicle is fully charged! (100%)');
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 [Telemetry WS] Disconnected.');
      setTelemetryState(prev => ({
        ...prev,
        speed_kmh: 0,
        isCharging: false,
        powerDraw_kW: 0,
        estimatedChargeTime_mins: 0
      }));
    });

    // Restore active session if it exists on load
    const restoreActiveSession = async () => {
      try {
        const res = await api.get('/sessions');
        const active = res.data.sessions?.find(s => s.status === 'active');
        if (active) {
          setActiveSession({
            ...active,
            pricing: 15.0, // Fallback price
            isFast: true
          });
          newSocket.emit('session:subscribe', { sessionId: active._id });
        }
      } catch (err) {
        console.warn('Failed to restore active session:', err.message);
      }
    };
    restoreActiveSession();

    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  const startChargingSession = async (stationId, slotId, pricing, isFast = true) => {
    if (!activeVehicle) {
      alert('Please select a default vehicle in settings garage first.');
      return;
    }

    try {
      const res = await api.post('/sessions/start', {
        vehicleId: activeVehicle._id,
        stationId,
        slotId
      });

      if (res.data.success) {
        const session = res.data.session;
        const sessionFormatted = {
          ...session,
          pricing,
          isFast
        };
        setActiveSession(sessionFormatted);
        
        // Subscribe to socket room for active updates
        if (socket && socket.connected) {
          socket.emit('session:subscribe', { sessionId: session._id });
          console.log(`🔌 [Telemetry WS] Sent subscription room request for: ${session._id}`);
        }
      }
    } catch (err) {
      console.error('❌ [TelemetryContext] Start session failed:', err.message);
      alert(err.response?.data?.message || 'Failed to initialize charging session on server.');
    }
  };

  const stopChargingSession = async () => {
    if (!activeSession) return;

    try {
      const res = await api.put(`/sessions/${activeSession._id}/end`);
      if (res.data.success) {
        setActiveSession(null);
        resetSession();
      }
    } catch (err) {
      console.error('❌ [TelemetryContext] Stop session failed:', err.message);
      setActiveSession(null);
      resetSession();
    }
  };

  const resetSession = () => {
    setActiveSession(null);
    setTelemetry({
      chargePercent: 0,
      kwhCharged: 0,
      powerDraw_kW: 0,
      elapsedSeconds: 0,
      totalCost: 0
    });
  };

  const startDrivingSim = (vehicleId, speed = 80, hvac = false, terrain = 'flat') => {
    if (socket && socket.connected) {
      socket.emit('driving:start', { vehicleId, speedKmph: speed, hvacOn: hvac, terrain });
      setIsDriving(true);
    }
  };

  const stopDrivingSim = (vehicleId) => {
    if (socket && socket.connected) {
      socket.emit('driving:stop', { vehicleId });
      setIsDriving(false);
      setDrivingTelemetry(null);
    }
  };

  return (
    <TelemetryContext.Provider value={{
      socket,
      activeSession,
      telemetry,
      startChargingSession,
      stopChargingSession,
      resetSession,
      isDriving,
      drivingTelemetry,
      startDrivingSim,
      stopDrivingSim,
      telemetryState,
      loading,
      error
    }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => useContext(TelemetryContext);
export default TelemetryContext;
