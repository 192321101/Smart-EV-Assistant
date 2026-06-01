import React, { useState, useEffect } from 'react';
import { useStations } from '../context/StationContext';
import { useVehicles } from '../context/VehicleContext';
import { useTelemetry } from '../context/TelemetryContext';
import MapCanvas from '../components/MapCanvas';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  MapPin, 
  Navigation as NavIcon, 
  Compass, 
  Sparkles, 
  AlertTriangle, 
  ArrowRight, 
  Activity, 
  Filter, 
  Search, 
  Heart, 
  History, 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  RefreshCw 
} from 'lucide-react';

export default function Navigation() {
  const { stations, filters, setFilters, loading: stationsLoading, fetchStations } = useStations();
  const { activeVehicle } = useVehicles();
  const { socket } = useTelemetry();
  const { token } = useAuth();
  
  // Navigation & Form inputs
  const [startLocationText, setStartLocationText] = useState('Home (Poonamallee)');
  const [destination, setDestination] = useState('');
  const [selectedStationId, setSelectedStationId] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(() => {
    const saved = localStorage.getItem('ev_current_coords');
    try {
      return saved ? JSON.parse(saved) : [80.0945, 13.0473];
    } catch (e) {
      return [80.0945, 13.0473];
    }
  });

  useEffect(() => {
    localStorage.setItem('ev_current_coords', JSON.stringify(currentCoords));
  }, [currentCoords]);
  
  // Suggestion & Database lists
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [routeHistory, setRouteHistory] = useState([]);
  const [dynamicStations, setDynamicStations] = useState([]);
  
  // Geolocation & Simulation states
  const [isUsingGPS, setIsUsingGPS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navIndex, setNavIndex] = useState(0);
  
  // Live stats HUD
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [remainingDist, setRemainingDist] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [lastVoiceAlert, setLastVoiceAlert] = useState('GPS Copilot standby.');

  // Load favorites and history sidebar on mount
  const loadSidebarData = async () => {
    try {
      const [favsRes, histRes] = await Promise.all([
        api.get('/navigation/favorites'),
        api.get('/navigation/history')
      ]);
      if (favsRes.data.success) setFavorites(favsRes.data.favorites);
      if (histRes.data.success) setRouteHistory(histRes.data.history);
    } catch (e) {
      console.warn("❌ [Sidebar] Failed to load history/favorites data");
    }
  };

  useEffect(() => {
    loadSidebarData();
  }, []);

  // Sync live location updates via Sockets when GPS is active
  useEffect(() => {
    if (!socket || !token || !isUsingGPS) return;

    const sendLocationUpdate = (lat, lng, speed = 0) => {
      socket.emit('location:update', { lat, lng, speedKmph: speed });
    };

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed } = pos.coords;
          sendLocationUpdate(latitude, longitude, speed ? (speed * 3.6) : 0);
          setCurrentCoords([longitude, latitude]);
        },
        (err) => {
          console.warn('Geolocation permission lost during active tracking.');
          setIsUsingGPS(false);
        },
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [socket, token, isUsingGPS]);

  // Handle autocomplete search queries
  const fetchStartSuggestions = async (val) => {
    setStartLocationText(val);
    if (!val.trim()) {
      setStartSuggestions([]);
      return;
    }
    try {
      const res = await api.get(`/navigation/search?q=${encodeURIComponent(val)}`);
      if (res.data.success) {
        setStartSuggestions(res.data.suggestions);
      }
    } catch (e) {
      console.warn("Search suggestions failed");
    }
  };

  const fetchDestSuggestions = async (val) => {
    setDestination(val);
    if (!val.trim()) {
      setDestSuggestions([]);
      return;
    }
    try {
      const res = await api.get(`/navigation/search?q=${encodeURIComponent(val)}`);
      if (res.data.success) {
        setDestSuggestions(res.data.suggestions);
      }
    } catch (e) {
      console.warn("Search suggestions failed");
    }
  };

  // TTS Readout helper
  const speakVoice = (text) => {
    if (isMuted) return;
    setLastVoiceAlert(text);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Activate geolocation
  const enableGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCurrentCoords([longitude, latitude]);
          setStartLocationText(`My Location [${longitude.toFixed(4)}, ${latitude.toFixed(4)}]`);
          setIsUsingGPS(true);
          setShowPrompt(false);
          speakVoice("GPS system activated. Location lock completed.");
        },
        (err) => {
          console.warn('Geolocation permission denied.');
          alert("Location access denied or unavailable. Using default starting position (Home (Poonamallee)).");
          setIsUsingGPS(false);
          setShowPrompt(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setShowPrompt(false);
    }
  };

  const declineGPS = () => {
    setIsUsingGPS(false);
    setShowPrompt(false);
  };

  const planRouteTo = async (destName) => {
    if (!destName) return;
    setDestination(destName);
    setCalculating(true);
    setRouteData(null);
    setNavIndex(0);

    try {
      const res = await api.post('/navigation/route', {
        startCoords: currentCoords,
        startName: startLocationText,
        destination: destName.trim()
      });

      if (res.data.success && res.data.route) {
        const r = res.data.route;
        setRouteData(r);
        if (r.targetStationId) {
          setSelectedStationId(r.targetStationId);
        }
        
        speakVoice(`Route planned to ${r.destinationName}. Total distance ${r.distance} kilometers. Est. battery remaining ${r.socAtArrival} percent.`);
        loadSidebarData(); // Refresh history list
      }
    } catch (err) {
      console.error('❌ [Route Plan] API routing request failed:', err.message);
      alert('Failed to connect to navigation routing service.');
    } finally {
      setCalculating(false);
    }
  };

  // Submit routing request
  const handleRouteSearch = async (e) => {
    if (e) e.preventDefault();
    if (!destination.trim()) return;
    planRouteTo(destination);
  };

  // Listen for Voice actions (custom events)
  useEffect(() => {
    const handleVoiceAction = (e) => {
      const { action, params } = e.detail;
      console.log('📡 [Navigation] Voice Action Event:', action, params);

      if (action === 'plan_route' && params && params.destination) {
        planRouteTo(params.destination);
      } else if (action === 'start_navigation') {
        if (routeData) {
          setIsNavigating(true);
          setNavIndex(0);
          speakVoice("Starting navigation guidance.");
        } else {
          speakVoice("Please plan a route first before starting navigation.");
        }
      } else if (action === 'stop_navigation') {
        setIsNavigating(false);
        setCurrentSpeed(0);
        speakVoice("Navigation simulation paused.");
      } else if (action === 'recalculate_route' || action === 'find_fastest_route') {
        handleRecalculate();
      }
    };

    window.addEventListener('voice-action', handleVoiceAction);
    return () => window.removeEventListener('voice-action', handleVoiceAction);
  }, [routeData, currentCoords, destination]);

  // Check pending actions on mount
  useEffect(() => {
    const pending = sessionStorage.getItem('pending_voice_action');
    if (pending) {
      try {
        const { action, destination: dest } = JSON.parse(pending);
        sessionStorage.removeItem('pending_voice_action');
        if (action === 'plan_route' && dest) {
          setTimeout(() => {
            planRouteTo(dest);
          }, 300);
        }
      } catch (e) {
        console.warn('Failed parsing pending voice action:', e);
      }
    }
  }, []);

  // Clicking map pins computes the route directly
  const handleMapStationSelect = async (id) => {
    setSelectedStationId(id);
    const station = stations.find(s => s._id === id);
    if (station) {
      setDestination(station.name);
      setCalculating(true);
      try {
        const res = await api.post('/navigation/route', {
          startCoords: currentCoords,
          startName: startLocationText,
          destination: station.name
        });
        if (res.data.success && res.data.route) {
          setRouteData(res.data.route);
          speakVoice(`Navigating to ${station.name}.`);
        }
      } catch (e) {
        console.warn('API station route trace failed.');
      } finally {
        setCalculating(false);
      }
    }
  };

  // Save favorite handler
  const handleAddFavorite = async () => {
    if (!destination.trim()) return;
    try {
      const res = await api.post('/navigation/favorites', {
        name: destination,
        address: 'Bandra-Worli Expressway Route Corridor, Mumbai',
        coordinates: currentCoords
      });
      if (res.data.success) {
        speakVoice("Destination saved to favorites.");
        alert("Destination saved successfully!");
        loadSidebarData();
      }
    } catch (e) {
      alert("Failed to save location to favorites.");
    }
  };

  const getClosestStationOnRoute = () => {
    if (!stations || stations.length === 0) return null;
    let closest = null;
    let minDistance = Infinity;
    
    stations.forEach(st => {
      if (st.location && st.location.coordinates) {
        const [stLng, stLat] = st.location.coordinates;
        const dist = Math.sqrt(
          Math.pow(stLng - currentCoords[0], 2) +
          Math.pow(stLat - currentCoords[1], 2)
        );
        if (dist < minDistance) {
          minDistance = dist;
          closest = st;
        }
      }
    });
    return closest;
  };

  const closestStation = getClosestStationOnRoute();

  const handleMapClick = async (lng, lat) => {
    try {
      const res = await api.get(`/stations/nearby?lng=${lng}&lat=${lat}`);
      if (res.data.success && res.data.stations.length > 0) {
        setDynamicStations(prev => {
          const merged = [...prev];
          res.data.stations.forEach(newSt => {
            if (!merged.some(s => s._id === newSt._id)) {
              merged.push(newSt);
            }
          });
          return merged;
        });
        speakVoice(`Loaded ${res.data.stations.length} charging stations nearby.`);
        // Re-fetch global stations from the database to include newly seeded ones
        fetchStations();
      }
    } catch (e) {
      console.warn("Failed to retrieve dynamic stations", e);
    }
  };

  const allMapStations = [
    ...stations,
    ...dynamicStations.filter(ds => !stations.some(s => s._id === ds._id))
  ];

  // Simulated GPS Navigation Loop
  useEffect(() => {
    if (!isNavigating || !routeData) return;
    const isGps = routeData.gpsCoordinates && routeData.gpsCoordinates.length > 0;
    const coordsList = isGps ? routeData.gpsCoordinates : routeData.coordinates;
    if (!coordsList) return;

    const interval = setInterval(async () => {
      setNavIndex(prev => {
        const next = prev + 1;
        if (next >= coordsList.length) {
          clearInterval(interval);
          setIsNavigating(false);
          setCurrentSpeed(0);
          speakVoice("You have arrived at your destination.");
          alert("Arrived at destination!");
          return 0;
        }

        const total = coordsList.length;
        const progress = next / total;
        
        // Emulate Speedometer
        const speed = Math.round(55 + Math.random() * 15);
        setCurrentSpeed(speed);

        // Calculate location point
        let userLng, userLat;
        if (isGps) {
          [userLng, userLat] = coordsList[next];
        } else {
          userLng = currentCoords[0] + (currentCoords[0] * 0.0005 * progress);
          userLat = currentCoords[1] + (currentCoords[1] * 0.0005 * progress);
        }
        
        setCurrentCoords([userLng, userLat]);
        
        if (socket && token) {
          socket.emit('location:update', { lat: userLat, lng: userLng, speedKmph: speed });
        }

        // Live stats calculations
        const remDist = Math.max(0, Number((routeData.distance * (1 - progress)).toFixed(1)));
        const remTime = Math.round(routeData.timeMinutes * (1 - progress));
        setRemainingDist(remDist);
        setRemainingTime(remTime);

        // TTS Readouts at certain progress indexes
        if (next === 1) {
          speakVoice(`Navigation started to ${routeData.destinationName}. Current speed ${speed} km h.`);
        } else if (next === Math.round(total * 0.35)) {
          speakVoice("In 300 meters, prepare to take exit 12 for Powai.");
        } else if (next === Math.round(total * 0.7) && routeData.recommendedStop) {
          speakVoice(`Range alert. Suggested charging station approaching: ${routeData.recommendedStop.name}.`);
        }

        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isNavigating, routeData, socket, token]);

  const toggleNavigation = () => {
    if (!routeData) return;
    if (isNavigating) {
      setIsNavigating(false);
      setCurrentSpeed(0);
      speakVoice("Navigation simulation paused.");
    } else {
      setIsNavigating(true);
      setNavIndex(0);
      setRemainingDist(routeData.distance);
      setRemainingTime(routeData.timeMinutes);
    }
  };

  const handleRecalculate = async () => {
    if (!destination) return;
    try {
      const res = await api.get(`/navigation/recalculate?destination=${encodeURIComponent(destination)}&currentLng=${currentCoords[0]}&currentLat=${currentCoords[1]}`);
      if (res.data.success) {
        setRouteData(res.data.route);
        setNavIndex(0);
        speakVoice("Route deviation detected. Recalculating path to destination.");
        alert("Route recalculated successfully!");
      }
    } catch (e) {
      alert("Failed to recalculate route.");
    }
  };

  // Convert current navigation index to active canvas coordinates for MapCanvas indicator
  const activeUserCoordsCanvas = routeData && isNavigating && routeData.coordinates
    ? routeData.coordinates[navIndex]
    : null;

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">Smart Route Copilot</h1>
        <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
          GPS Route Planning & Range Telemetry Integration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Destination input & Elevation analysis */}
        <div className="space-y-6 lg:col-span-1">
          {/* Location Prompt Banner */}
          {showPrompt && (
            <div className="glass-panel p-4 rounded-3xl border border-indigo-100 bg-gradient-to-r from-sky-50/50 to-indigo-50/50 shadow-sm text-left space-y-3">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Use Current Location?</h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-normal mt-0.5">
                    Enable GPS to plan routes starting from your exact live position.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={declineGPS}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-[10px] rounded-xl transition-all"
                >
                  Use Default
                </button>
                <button
                  type="button"
                  onClick={enableGPS}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl transition-all shadow-sm shadow-indigo-500/10"
                >
                  Yes, Use GPS
                </button>
              </div>
            </div>
          )}

          {/* Panel A: Path Planner Form */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 text-left">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Compass className="w-5 h-5 text-indigo-500" />
                <span>Route Planner</span>
              </span>
              {destination && (
                <button
                  type="button"
                  onClick={handleAddFavorite}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg transition-all"
                  title="Add Destination to Favorites"
                >
                  <Heart className="w-3.5 h-3.5 fill-rose-500" />
                </button>
              )}
            </h3>
            
            <form onSubmit={handleRouteSearch} className="space-y-4">
              {/* Start Location Input */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Starting Position</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    value={startLocationText}
                    onChange={(e) => fetchStartSuggestions(e.target.value)}
                    placeholder="Enter starting location..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white/50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
                
                {/* Start Autocomplete suggestions */}
                {startSuggestions.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {startSuggestions.map((place, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setStartLocationText(place.name);
                          setCurrentCoords(place.coordinates);
                          setStartSuggestions([]);
                          setIsUsingGPS(false);
                        }}
                        className="px-3 py-2 text-xs font-semibold hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 text-slate-700"
                      >
                        <p className="font-bold text-slate-800">{place.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{place.address}</p>
                      </div>
                    ))}
                  </div>
                )}

                {!isUsingGPS ? (
                  <button
                    type="button"
                    onClick={enableGPS}
                    className="mt-2 text-[10px] text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1 transition-all"
                  >
                    <NavIcon className="w-3 h-3 text-indigo-500 rotate-45" />
                    <span>Switch to current position?</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentCoords([80.0945, 13.0473]);
                      setStartLocationText('Home (Poonamallee)');
                      setIsUsingGPS(false);
                    }}
                    className="mt-2 text-[10px] text-slate-500 hover:text-slate-700 font-extrabold flex items-center gap-1 transition-all"
                  >
                    <span>Use default starting position (Home (Poonamallee))</span>
                  </button>
                )}
              </div>

              {/* Destination Input */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Destination</label>
                <div className="relative">
                  <NavIcon className="absolute left-3 top-3 w-4.5 h-4.5 text-sky-500" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => fetchDestSuggestions(e.target.value)}
                    placeholder="Enter destination place..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white/50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                {/* Destination Autocomplete suggestions */}
                {destSuggestions.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {destSuggestions.map((place, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setDestination(place.name);
                          setDestSuggestions([]);
                        }}
                        className="px-3 py-2 text-xs font-semibold hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 text-slate-700"
                      >
                        <p className="font-bold text-slate-800">{place.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{place.address}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={calculating}
                className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                {calculating ? 'Tracing optimal paths...' : 'Analyze Range Path'}
              </button>
            </form>
          </div>

          {/* Panel B: Active Route Metrics */}
          {routeData && (
            <div className="glass-panel p-5 rounded-3xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/20 text-left space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-bold text-sky-600 uppercase tracking-widest bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full">
                    Route Evaluation
                  </span>
                  <h4 className="text-sm font-bold text-slate-800 mt-2">{routeData.destinationName}</h4>
                </div>
                
                {/* Mute button */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
                  title={isMuted ? "Unmute Voice Guidance" : "Mute Voice Guidance"}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-500" />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white border border-slate-100 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining Dist</span>
                  <span className="text-base font-black text-slate-800">
                    {isNavigating ? remainingDist : routeData.distance} km
                  </span>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ETA Remaining</span>
                  <span className="text-base font-black text-slate-800">
                    {isNavigating ? remainingTime : routeData.timeMinutes} mins
                  </span>
                </div>
              </div>

              {/* Range verification tag */}
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-emerald-500 shrink-0 animate-pulse" />
                <span>EV Range Safe. SoC at arrival: ~{routeData.socAtArrival}%.</span>
              </div>

              {/* Nearest charging station along the route */}
              {closestStation && (
                <div 
                  onClick={() => handleMapStationSelect(closestStation._id)}
                  className="p-3 bg-indigo-50/40 hover:bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs font-bold text-slate-700 flex items-start gap-2.5 cursor-pointer transition-all active:scale-98"
                  title="Click to route to this station"
                >
                  <MapPin className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider block">Nearest Station Along Way</span>
                    <span className="text-slate-800 font-extrabold mt-0.5 block">{closestStation.name}</span>
                    <span className="text-[10px] text-slate-400 font-semibold leading-tight block mt-0.5">{closestStation.location.address}</span>
                  </div>
                </div>
              )}

              {/* Warning stop alert */}
              {routeData.recommendedStop && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-xs font-bold text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="leading-tight">SoC Battery Critical!</p>
                    <p className="text-[10px] text-amber-600 mt-0.5 leading-tight">
                      Charge stop suggested at {routeData.recommendedStop.name}.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Action controls */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={toggleNavigation}
                  className={`py-2 px-4 font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 text-white ${
                    isNavigating 
                      ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' 
                      : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                  }`}
                >
                  {isNavigating ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-white" />
                      <span>Stop GPS Sim</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Start GPS Sim</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRecalculate}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-900 font-bold text-xs text-white rounded-xl shadow flex items-center justify-center gap-1.5 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Deviate Path</span>
                </button>
              </div>

              {/* Live HUD voice alert log */}
              {isNavigating && (
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span className="text-[10px] font-bold text-emerald-400 tracking-tight line-clamp-1">
                    🎙️ Autopilot: {lastVoiceAlert}
                  </span>
                </div>
              )}

              {/* Elevation profile */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Elevation Profile</span>
                </span>
                <div className="h-16 w-full bg-slate-50 border border-slate-200/50 rounded-xl relative overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <path
                      d="M 0 35 Q 20 20 40 10 T 80 25 T 100 35 L 100 40 L 0 40 Z"
                      fill="rgba(14, 165, 233, 0.08)"
                      stroke="#0ea5e9"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <span className="absolute bottom-1 right-2 text-[9px] font-bold text-slate-400">Peak: +{routeData.elevationGain}m</span>
                  <span className="absolute bottom-1 left-2 text-[9px] font-bold text-slate-400">0m</span>
                </div>
              </div>
            </div>
          )}

          {/* Sidebar Section: Favorites & History list */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 text-left space-y-4">
            {/* Favorites List */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>Favorite Locations</span>
              </h4>
              {favorites.length === 0 ? (
                <p className="text-[10px] font-semibold text-slate-400 italic">No favorite places saved yet.</p>
              ) : (
                <div className="space-y-2">
                  {favorites.map((fav, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        setDestination(fav.name);
                        speakVoice(`Selected favorite location: ${fav.name}`);
                      }}
                      className="p-2.5 bg-slate-50/70 hover:bg-indigo-50/50 border border-slate-200/30 rounded-2xl cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-700 leading-tight">{fav.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium leading-tight mt-0.5 line-clamp-1">{fav.address}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-slate-200/60" />

            {/* History List */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                <History className="w-3.5 h-3.5 text-indigo-500" />
                <span>Recent Route History</span>
              </h4>
              {routeHistory.length === 0 ? (
                <p className="text-[10px] font-semibold text-slate-400 italic">No recent routes logged.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {routeHistory.map((hist, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setStartLocationText(hist.startName);
                        setDestination(hist.destinationName);
                        speakVoice(`Reloading route to ${hist.destinationName}.`);
                      }}
                      className="p-2.5 bg-slate-50/50 hover:bg-slate-100/50 border border-slate-200/30 rounded-2xl cursor-pointer transition-all text-[10px] font-bold text-slate-600 flex justify-between items-center"
                    >
                      <div className="space-y-0.5">
                        <p className="text-slate-800 font-extrabold">{hist.destinationName}</p>
                        <p className="text-[9px] text-slate-400 font-semibold">From: {hist.startName}</p>
                        <p className="text-[9px] text-sky-600 uppercase tracking-wide">
                          {hist.distance_km} km | {hist.duration_min} mins | {hist.chargingStops?.length > 0 ? "⚡ Stop Included" : "⚡ Direct Route"}
                        </p>
                      </div>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Map Canvas Component View */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-4 rounded-3xl border border-slate-200/50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-sky-500" />
                <span>Click station pins to compute routes</span>
              </span>
              
              {/* Dynamic Speedometer Overlay during Drive simulation */}
              {isNavigating && (
                <div className="px-3 py-1 bg-sky-500 border border-sky-400 rounded-full text-white text-xs font-extrabold tracking-wider animate-pulse flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>SPEED: {currentSpeed} KM/H</span>
                </div>
              )}

              {!isNavigating && (
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Telemetry Grid Activated
                </span>
              )}
            </div>

            {/* Filtering Control Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-slate-50 rounded-2xl border border-slate-200/40">
              <div className="flex items-center gap-1.5 text-slate-400 px-1 border-r border-slate-200 mr-1 shrink-0">
                <Filter className="w-3.5 h-3.5" />
                <span className="text-[9px] font-extrabold uppercase tracking-wider">Filters</span>
              </div>

              <select
                value={filters.connectorType}
                onChange={(e) => setFilters(prev => ({ ...prev, connectorType: e.target.value }))}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">Connector: All Plugs</option>
                <option value="ccs">DC Fast (CCS)</option>
                <option value="type 2">AC (Type 2)</option>
              </select>

              <select
                value={filters.minPower}
                onChange={(e) => setFilters(prev => ({ ...prev, minPower: parseInt(e.target.value) || 0 }))}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="0">Power: All kW</option>
                <option value="22">Min 22 kW</option>
                <option value="50">Min 50 kW</option>
                <option value="120">Min 120 kW</option>
              </select>

              <button
                onClick={() => setFilters(prev => ({ ...prev, onlyAvailable: !prev.onlyAvailable }))}
                className={`px-3 py-1.5 border rounded-xl text-[10px] font-bold transition-all ${
                  filters.onlyAvailable
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Only Available Slots
              </button>
            </div>
            
            <MapCanvas
              stations={allMapStations}
              activeStationId={selectedStationId}
              onSelectStation={handleMapStationSelect}
              onMapClick={handleMapClick}
              selectedRoute={routeData?.coordinates}
              selectedRouteGps={routeData?.gpsCoordinates}
              userRangeKm={activeVehicle ? activeVehicle.range_km : 243}
              userCoordsCanvas={activeUserCoordsCanvas}
              userCoordsGps={currentCoords}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
