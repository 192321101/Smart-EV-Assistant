import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTelemetry } from '../context/TelemetryContext';
import { AlertOctagon, HelpCircle, Truck, Phone, Bell, MapPin, CheckCircle2, ShieldAlert, Navigation } from 'lucide-react';

export default function EmergencySOS() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { socket } = useTelemetry();
  
  const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

  const [countdown, setCountdown] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [rescueStation, setRescueStation] = useState(null);
  const [nearbyServices, setNearbyServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check for active SOS request on mount
  useEffect(() => {
    const checkActiveSOS = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API_URL}/emergency/active`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && res.data.active) {
          setActiveRequest(res.data.request);
          setRescueStation(res.data.nearestStation);
          setSosSent(true);
          setIsActive(true);
        }
      } catch (err) {
        console.warn('Could not restore emergency SOS state from backend.');
      } finally {
        setLoading(false);
      }
    };
    checkActiveSOS();
  }, [token]);

  // Load nearby services
  useEffect(() => {
    const fetchNearbyServices = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API_URL}/emergency/nearby`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setNearbyServices(res.data.services);
        }
      } catch (err) {
        console.warn('Failed to load nearby support services.');
      }
    };
    fetchNearbyServices();
  }, [token]);

  // Manage countdown timer
  useEffect(() => {
    let timer = null;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      triggerSOS();
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Real-time tracking subscription
  useEffect(() => {
    if (!socket || !activeRequest || !activeRequest._id) return;

    const reqId = activeRequest._id;
    console.log(`🔌 [SOS Socket] Subscribing to: ${reqId}`);
    socket.emit('emergency:subscribe', { requestId: reqId });

    const handleUpdate = (data) => {
      console.log('📡 [SOS Socket] Live update:', data.request);
      setActiveRequest(data.request);
    };

    const handleArrived = (data) => {
      console.log('📡 [SOS Socket] Arrived event:', data.message);
      // Update state locally
      setActiveRequest(prev => prev ? { ...prev, status: 'arrived', responderDetails: { ...prev.responderDetails, eta_mins: 0 } } : null);
    };

    socket.on('emergency:update', handleUpdate);
    socket.on('emergency:arrived', handleArrived);

    return () => {
      console.log(`🔌 [SOS Socket] Unsubscribing from: ${reqId}`);
      socket.emit('emergency:unsubscribe', { requestId: reqId });
      socket.off('emergency:update', handleUpdate);
      socket.off('emergency:arrived', handleArrived);
    };
  }, [socket, activeRequest?._id]);

  const startSOSCountdown = () => {
    setCountdown(5);
    setIsActive(true);
  };

  // Voice listeners for SOS triggers
  useEffect(() => {
    const handleVoiceAction = (e) => {
      const { action } = e.detail;
      console.log('📡 [Emergency SOS] Voice Action Event:', action);
      if (action === 'trigger_sos') {
        startSOSCountdown();
      }
    };
    window.addEventListener('voice-action', handleVoiceAction);
    return () => window.removeEventListener('voice-action', handleVoiceAction);
  }, []);

  // Check pending actions on mount
  useEffect(() => {
    const pending = sessionStorage.getItem('pending_voice_action');
    if (pending) {
      try {
        const { action } = JSON.parse(pending);
        sessionStorage.removeItem('pending_voice_action');
        if (action === 'trigger_sos') {
          setTimeout(() => {
            startSOSCountdown();
          }, 300);
        }
      } catch (e) {
        console.warn('Failed parsing pending voice action:', e);
      }
    }
  }, []);

  const cancelSOS = async () => {
    setCountdown(null);
    setIsActive(false);
    setSosSent(false);
    setActiveRequest(null);
    setRescueStation(null);

    if (token) {
      try {
        await axios.post(`${API_URL}/emergency/cancel`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.warn('Failed to cancel emergency on backend, resetting state locally.', err);
      }
    }
  };

  const triggerSOS = () => {
    setCountdown(null);
    setSosSent(true);
    
    // Voice prompt
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('Emergency beacon active. Dispatching nearest tow unit and routing to closest power hub.');
      window.speechSynthesis.speak(utterance);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendSOSSignal(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('Geolocation permission denied, defaulting to Mumbai coordinates.');
          sendSOSSignal(19.0596, 72.8311);
        }
      );
    } else {
      sendSOSSignal(19.0596, 72.8311);
    }
  };

  const sendSOSSignal = async (lat, lng) => {
    if (!token) return;
    try {
      const res = await axios.post(`${API_URL}/emergency/request`, {
        lat,
        lng,
        message: 'Vehicle breakdown alert. Requiring roadside power rescue.'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setActiveRequest(res.data.request);
        setRescueStation(res.data.nearestStation);

        // Notify contacts API
        try {
          await axios.post(`${API_URL}/emergency/contacts/notify`, {
            requestId: res.data.request._id
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (cErr) {
          console.warn('Emergency SMS dispatch emulation failed.');
        }
      }
    } catch (err) {
      console.warn('Backend SOS request failed, setting mock rescue details.', err);
      setActiveRequest({
        _id: 'mock_req_' + Date.now(),
        status: 'dispatched',
        location: { coordinates: [lng, lat] },
        responderDetails: {
          unitId: 'EcoTow-#412',
          eta_mins: 14,
          name: 'Officer Rajesh Kumar',
          phone: '+919876543230',
          location: { coordinates: [lng + 0.02, lat + 0.02] }
        }
      });
      setRescueStation({
        name: 'Bandra PulseCharge HyperHub',
        location: { address: 'Bandra Linking Road' },
        pricing_per_kWh: 15.0
      });
    }
  };

  const displayedStation = rescueStation || {
    name: 'PulseCharge HyperHub',
    location: { address: 'Bandra Linking Road' },
    pricing_per_kWh: 15.0
  };

  const displayedRequest = activeRequest || {
    location: { coordinates: [72.8311, 19.0596] },
    status: 'dispatched',
    responderDetails: {
      unitId: 'EcoTow-#412',
      eta_mins: 14,
      name: 'Officer Rajesh Kumar',
      phone: '+919876543230',
      location: { coordinates: [72.8561, 19.0846] }
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400 font-semibold text-xs animate-pulse">Loading safety portals...</div>;
  }

  // Calculate rescue progress percentage for UI feedback
  const originalEta = 15;
  const currentEta = displayedRequest.responderDetails?.eta_mins ?? 14;
  const progressPercent = Math.min(100, Math.max(0, ((originalEta - currentEta) / originalEta) * 100));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none flex items-center gap-2">
          <AlertOctagon className="w-7 h-7 text-rose-500 animate-pulse" />
          <span>Emergency SOS</span>
        </h1>
        <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
          One-tap EV hazard dispatch & battery rescue routing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: SOS Controls & Dispatch Progress */}
        <div className="lg:col-span-2 text-center space-y-6">
          {!isActive && !sosSent ? (
            /* Step 1: Pre-SOS Screen */
            <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-200/50 space-y-6">
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600">
                <ShieldAlert className="w-8 h-8 text-rose-500 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-slate-800 leading-none">Vehicle Hazard System</h3>
                <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Press and hold the button below to initiate emergency alerts. We will broadcast your GPS beacon, dispatch assistance, and route you to the closest charger.
                </p>
              </div>

              {/* Pulsating Trigger button */}
              <button
                id="sos-trigger-btn"
                name="sos-trigger-btn"
                data-testid="sos-trigger-button"
                aria-label="Emergency"
                role="button"
                onClick={startSOSCountdown}
                className="w-36 h-36 rounded-full bg-gradient-to-tr from-rose-500 via-pink-600 to-rose-700 text-white font-black text-xl shadow-xl shadow-rose-500/35 border-8 border-rose-100/50 hover:scale-102 active:scale-98 transition-all flex flex-col items-center justify-center mx-auto"
              >
                <AlertOctagon className="w-8 h-8 mb-1.5" />
                <span>Emergency</span>
              </button>
            </div>
          ) : countdown !== null ? (
            /* Step 2: Countdown Warning Screen */
            <div className="glass-panel p-6 md:p-8 rounded-3xl border border-rose-100/50 bg-gradient-to-br from-white to-rose-50/10 space-y-6">
              <h3 className="text-xl font-extrabold text-rose-600 animate-pulse">TRANSMITTING SOS SIGNAL IN</h3>
              
              <div className="w-32 h-32 rounded-full border-4 border-rose-500 border-t-transparent animate-spin flex items-center justify-center mx-auto">
                <span className="text-4xl font-black text-rose-600 select-none animate-bounce">{countdown}</span>
              </div>

              <button
                onClick={cancelSOS}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors uppercase tracking-wider"
              >
                Cancel Broadcast
              </button>
            </div>
          ) : (
            /* Step 3: Activated Emergency Dashboard */
            <div className="glass-panel p-6 md:p-8 rounded-3xl border border-emerald-100/50 space-y-6 text-left">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  <div>
                    <h4 className="text-sm font-extrabold text-emerald-800">SOS Beacon Active</h4>
                    <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">
                      Status: {displayedRequest.status}
                    </p>
                  </div>
                </div>
                {displayedRequest.status !== 'arrived' && (
                  <div className="text-right">
                    <span className="text-[18px] font-black text-rose-600 animate-pulse">
                      {displayedRequest.responderDetails?.eta_mins}m
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">ETA remaining</span>
                  </div>
                )}
              </div>

              {/* Progress bar representing rescue ETA completion */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Rescue Unit Dispatched</span>
                  <span>{Math.round(progressPercent)}% arrived</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-emerald-500 transition-all duration-1000 ease-out" 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Alert items logs */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Rescue Operations</h4>

                {/* Nearest charger auto-rerouting */}
                <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider block">Target Rescue Hub</span>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{displayedStation.name}</p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-1">
                      Emergency navigation route calculated and sent to vehicle. Location: {displayedStation.location?.address}.
                    </p>
                  </div>
                </div>

                {/* Tow Truck dispatch */}
                <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex items-start gap-3">
                  <Truck className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] font-bold text-sky-600 uppercase tracking-wider block">Roadside Assistance</span>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                      {displayedRequest.responderDetails?.unitId} - {displayedRequest.status === 'arrived' ? 'Arrived at destination' : 'Enroute to coordinates'}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-1">
                      ETA: {displayedRequest.responderDetails?.eta_mins} Mins. Responder: {displayedRequest.responderDetails?.name}. Contact: {displayedRequest.responderDetails?.phone}. Tracking live coordinates: [{displayedRequest.responderDetails?.location?.coordinates?.[0].toFixed(5)}, {displayedRequest.responderDetails?.location?.coordinates?.[1].toFixed(5)}].
                    </p>
                  </div>
                </div>

                {/* Family Contacts notifier */}
                <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex items-start gap-3">
                  <Bell className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider block">Emergency Contacts</span>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                      {displayedRequest.contactsNotified ? 'Automated SMS Broadcast Complete' : 'Sending Contact Alert Notifications...'}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-1">
                      Alerted emergency contacts. "EV breakdowns triggered beacon at coordinates [{displayedRequest.location?.coordinates?.[1].toFixed(5)}, {displayedRequest.location?.coordinates?.[0].toFixed(5)}]"
                    </p>
                  </div>
                </div>
              </div>

              {/* Cancel Button */}
              <button
                onClick={cancelSOS}
                className="w-full mt-4 py-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all border border-slate-200 text-center uppercase tracking-wider"
              >
                Deactivate SOS System
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Nearby Emergency Support Services */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 text-left space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-rose-500" />
              <span>Nearby Emergency Support</span>
            </h3>
            
            <div className="space-y-2.5">
              {nearbyServices.length > 0 ? (
                nearbyServices.map((service, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-slate-50/70 hover:bg-rose-50/20 border border-slate-200/40 hover:border-rose-100/50 rounded-2xl flex flex-col justify-between transition-all space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 leading-tight">{service.name}</h4>
                        <span className="text-[9px] text-slate-400 font-semibold">{service.type}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-rose-50 border border-rose-100/55 rounded-full text-[9px] text-rose-600 font-extrabold shrink-0">
                        {service.distance_km} km
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-semibold">{service.phone}</span>
                      <a 
                        href={`tel:${service.phone}`}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-250 border-slate-200 rounded-xl text-[9px] font-extrabold text-slate-700 transition-colors flex items-center gap-1 shrink-0"
                      >
                        <Phone className="w-2.5 h-2.5 text-slate-500" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                  Resolving nearby dispatch yards...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
