import React, { useState, useEffect } from 'react';
import { useStations } from '../context/StationContext';
import { useVehicles } from '../context/VehicleContext';
import api from '../services/api';
import { 
  Coins, 
  TrendingDown, 
  Home, 
  BatteryCharging, 
  LineChart, 
  MapPin, 
  Zap, 
  Info,
  Calendar,
  PiggyBank,
  ChevronRight,
  TrendingUp,
  Percent,
  Car,
  Clock,
  ShieldAlert,
  Volume2,
  VolumeX,
  FileText,
  Search,
  Compass,
  ArrowRight
} from 'lucide-react';

export default function CostOptimizer() {
  const { stations } = useStations();
  const { activeVehicle } = useVehicles();

  // Segment Baseline Tariffs
  const segments = {
    '2W': { name: 'Two-Wheeler (Scooters/Bikes)', baseTariff: 9.0, avgCapacity: 3.5, chargePowerKw: 3.3, consumptionRate: 0.04, plug: '5A / AC Slow' },
    '3W': { name: 'Three-Wheeler (Auto-Rickshaws)', baseTariff: 11.5, avgCapacity: 8.0, chargePowerKw: 7.4, consumptionRate: 0.08, plug: 'G/T / LECCS' },
    '4W': { name: 'Four-Wheeler (Nexon/ZS EV)', baseTariff: 15.0, avgCapacity: 40.5, chargePowerKw: 50.0, consumptionRate: 0.16, plug: 'CCS / DC Fast' }
  };

  const [selectedSegment, setSelectedSegment] = useState('4W');
  const [selectedHour, setSelectedHour] = useState(new Date().getHours()); // Default to current local hour
  const [homeTariff, setHomeTariff] = useState(6.0); // ₹ per kWh
  const [chargeNeedKwh, setChargeNeedKwh] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  
  // Custom Route Optimizer Inputs
  const [startLocationText, setStartLocationText] = useState('Poonamallee');
  const [startCoords, setStartCoords] = useState([80.0945, 13.0473]); // Default: Poonamallee
  const [startSuggestions, setStartSuggestions] = useState([]);

  const [destination, setDestination] = useState('Kanchipuram');
  const [destCoords, setDestCoords] = useState([79.7016, 12.8342]); // Default: Kanchipuram
  const [destSuggestions, setDestSuggestions] = useState([]);

  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // Time-of-Use pricing bounds logic
  const getHourDetails = (hour) => {
    if (hour >= 22 || hour < 6) {
      return {
        label: 'Off-Peak Hours (Grid Discount)',
        adjustment: -2.0,
        color: 'bg-emerald-500/10 border-emerald-300 text-emerald-700',
        badge: 'bg-emerald-500 text-white',
        desc: 'Rebate Active: Excess grid surplus / wind power. 10 PM to 6 AM.'
      };
    } else if (hour >= 18 && hour < 22) {
      return {
        label: 'Super-Peak Hours (Demand Surge)',
        adjustment: 3.0,
        color: 'bg-rose-500/10 border-rose-300 text-rose-700 animate-pulse',
        badge: 'bg-rose-600 text-white',
        desc: 'Surge Pricing Active: Peak evening demand load. 6 PM to 10 PM.'
      };
    } else {
      return {
        label: 'Mid-Peak Hours (Normal Rate)',
        adjustment: 0.0,
        color: 'bg-blue-500/10 border-blue-300 text-blue-700',
        badge: 'bg-blue-500 text-white',
        desc: 'Baseline Rate: Normal grid demand load. 6 AM to 6 PM.'
      };
    }
  };

  const hourInfo = getHourDetails(selectedHour);
  const segmentData = segments[selectedSegment];

  // Dynamic public charging cost calculation per kWh
  const currentPublicCostKwh = segmentData.baseTariff + hourInfo.adjustment;
  const fullChargeUnits = segmentData.avgCapacity;
  const fullRechargeCost = Number((fullChargeUnits * currentPublicCostKwh).toFixed(1));

  // Sort and project real-time station prices relative to segment + hour of the day
  const sortedStations = [...stations]
    .map(st => {
      const scaleFactor = segmentData.baseTariff / 15.0; // scale based on base segment price
      const baseStationPrice = st.pricing_per_kWh * scaleFactor;
      const adjustedPrice = Math.max(5.0, Number((baseStationPrice + hourInfo.adjustment).toFixed(1)));
      const fullCharge = Math.round(fullChargeUnits * adjustedPrice);
      
      return {
        ...st,
        livePricePerKwh: adjustedPrice,
        liveFullCost: fullCharge
      };
    })
    .sort((a, b) => a.livePricePerKwh - b.livePricePerKwh);

  // Search Autocomplete Suggestion triggers
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

  // Compute Custom Route cost optimizer
  const handleOptimizeRoute = () => {
    setCalculating(true);
    
    // Calculate distance based on starting coordinates and destination coordinates
    const rawDist = Math.sqrt(
      Math.pow(destCoords[0] - startCoords[0], 2) +
      Math.pow(destCoords[1] - startCoords[1], 2)
    );
    // Scale distance (Chennai bounding box scaling factor of ~150)
    const distanceVal = Number(Math.max(2.0, rawDist * 150).toFixed(1)); 

    // Find the standard (high-cost) station and optimized (low-cost) station from dynamic pricing directory
    if (sortedStations.length < 2) {
      setCalculating(false);
      return;
    }
    const standardStation = sortedStations[sortedStations.length - 1];
    const cheapestStation = sortedStations[0];

    // Compute energy consumption based on distance and segment rate
    const energyNeeded = Number((distanceVal * segmentData.consumptionRate).toFixed(1));
    const standardCost = standardStation.livePricePerKwh * energyNeeded;
    const optimizedCost = cheapestStation.livePricePerKwh * energyNeeded;

    setOptimizedRoute({
      start: startLocationText,
      destination: destination,
      standardStation: standardStation.name,
      standardPrice: standardStation.livePricePerKwh,
      standardCost: standardCost,
      optimizedStation: cheapestStation.name,
      optimizedPrice: cheapestStation.livePricePerKwh,
      optimizedCost: optimizedCost,
      savings: Math.max(0, standardCost - optimizedCost),
      energyKwh: energyNeeded,
      distance: distanceVal
    });

    // Voice advisory
    if ('speechSynthesis' in window && !isMuted) {
      window.speechSynthesis.cancel();
      const text = `Route optimized from ${startLocationText} to ${destination}. Saving ₹${Math.max(0, standardCost - optimizedCost).toFixed(0)} by charging at ${cheapestStation.name} instead of standard hubs.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
    
    setCalculating(false);
  };

  // Trigger initial route optimization on mount / segment / hour changes
  useEffect(() => {
    handleOptimizeRoute();
  }, [startCoords, destCoords, selectedSegment, selectedHour, stations]);

  // Monthly Expenses (Simulated history stats)
  const monthlyStats = {
    totalSpent: 3840,
    totalKwh: 290,
    sessionsCount: 12,
    homePercent: 70, // 70% home, 30% public
    avgKwhCost: 13.2,
    fossilSavings: 11200 // saved compared to petrol
  };

  const homeTotalCost = Number((chargeNeedKwh * homeTariff).toFixed(1));
  const publicAvgCost = Number((chargeNeedKwh * currentPublicCostKwh).toFixed(1));
  const homeSavings = Number((publicAvgCost - homeTotalCost).toFixed(1));

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Coins className="text-indigo-500 w-7 h-7" />
            <span>Cost Optimizer</span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Real-time public tariffs & hourly time-of-use pricing models
          </p>
        </div>

        {/* Audio Advisory Button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="flex items-center justify-center p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
          title={isMuted ? "Unmute Copilot Voice" : "Mute Copilot Voice"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-indigo-500" />}
        </button>
      </div>

      {/* Grid: Vehicle Selector & Hourly Time-of-Use Slider */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Dynamic Parameters Selector */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-3xl border border-slate-200/50 text-left space-y-6">
          
          {/* Section A: Vehicle Segment Selector */}
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              1. Select Vehicle Classification
            </label>
            <div className="grid grid-cols-3 gap-3">
              {Object.keys(segments).map((key) => {
                const seg = segments[key];
                const isSelected = selectedSegment === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedSegment(key)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/10' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase block tracking-wider opacity-80">{key} classification</span>
                    <p className="text-xs font-black mt-1 leading-tight">{key === '2W' ? 'Two-Wheeler' : key === '3W' ? 'Three-Wheeler' : 'Four-Wheeler'}</p>
                    <p className={`text-[9px] font-semibold mt-1 block leading-tight ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                      Avg size: {seg.avgCapacity}kWh
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section B: Time-of-Day Charging Clock Slider */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                2. Hour of Charging (Time-of-Use Grid Rates)
              </label>
              <span className="text-xs font-extrabold text-indigo-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {selectedHour === 0 ? '12:00 Midnight' : selectedHour === 12 ? '12:00 Noon' : selectedHour > 12 ? `${selectedHour - 12}:00 PM` : `${selectedHour}:00 AM`}
                </span>
              </span>
            </div>

            {/* Slider */}
            <input 
              type="range"
              min="0"
              max="23"
              value={selectedHour}
              onChange={(e) => setSelectedHour(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            
            {/* Visual zones markers */}
            <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-wider px-1">
              <span>Midnight</span>
              <span>6 AM</span>
              <span>12 Noon</span>
              <span>6 PM (Peak Surge)</span>
              <span>10 PM (Off-Peak)</span>
            </div>

            {/* Live Hour Status Alert Card */}
            <div className={`p-4 rounded-2xl border text-xs font-semibold text-left space-y-1 mt-3 ${hourInfo.color}`}>
              <div className="flex justify-between items-center">
                <span className="font-extrabold">{hourInfo.label}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${hourInfo.badge}`}>
                  {hourInfo.adjustment > 0 ? `+₹${hourInfo.adjustment}` : hourInfo.adjustment < 0 ? `-₹${Math.abs(hourInfo.adjustment)}` : 'Flat'} / kWh
                </span>
              </div>
              <p className="text-[10px] opacity-90 mt-1">{hourInfo.desc}</p>
            </div>
          </div>
        </div>

        {/* Right Card: Charging Session Cost Summary */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 text-left flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Zap className="w-5 h-5 text-indigo-500" />
              <span>Session Economics</span>
            </h3>

            {/* Diagnostic stats */}
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200/40 rounded-2xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Hourly Public Rate</span>
                <span className="text-xl font-black text-slate-800">₹ {currentPublicCostKwh.toFixed(1)} / kWh</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/40 rounded-2xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Estimated Full Recharge Cost</span>
                <span className="text-xl font-black text-slate-800">₹ {fullRechargeCost.toFixed(0)}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Capacity: {fullChargeUnits} kWh ({segmentData.plug})</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-[10px] text-indigo-800 font-bold leading-normal flex items-start gap-1.5">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p>Pricing changes according to utility peak loads. Charge during green Off-Peak zones to save up to 35% in energy bills.</p>
          </div>
        </div>
      </div>

      {/* Grid: Custom Route Inputs & Optimizations */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Route inputs and pricing comparison list */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Custom Route Planner Forms */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 text-left space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Compass className="w-5 h-5 text-indigo-500 animate-spin" style={{ animationDuration: '8s' }} />
              <span>Route Budget Cost Planner</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Input */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Starting Position</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={startLocationText}
                    onChange={(e) => fetchStartSuggestions(e.target.value)}
                    placeholder="Enter starting location..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                {startSuggestions.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-250 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {startSuggestions.map((place, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setStartLocationText(place.name);
                          setStartCoords(place.coordinates);
                          setStartSuggestions([]);
                        }}
                        className="px-3 py-2 text-xs font-semibold hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 text-slate-700"
                      >
                        <p className="font-bold text-slate-800">{place.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium">{place.address}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination Input */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Destination</label>
                <div className="relative">
                  <ArrowRight className="absolute left-3 top-3 w-4 h-4 text-sky-500 animate-pulse" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => fetchDestSuggestions(e.target.value)}
                    placeholder="Enter destination place..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                {destSuggestions.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-250 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {destSuggestions.map((place, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setDestination(place.name);
                          setDestCoords(place.coordinates);
                          setDestSuggestions([]);
                        }}
                        className="px-3 py-2 text-xs font-semibold hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 text-slate-700"
                      >
                        <p className="font-bold text-slate-800">{place.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium">{place.address}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleOptimizeRoute}
              disabled={calculating}
              className="w-full py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider"
            >
              {calculating ? 'Analyzing energy prices...' : 'Calculate Cheapest Route Cost'}
            </button>
          </div>

          {/* Section B: Cheapest Route Optimizer output */}
          {optimizedRoute && (
            <div className="glass-panel p-5 rounded-3xl border border-indigo-150 bg-gradient-to-br from-white to-indigo-50/20 text-left space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                    Route Cost Optimizer
                  </span>
                  <h4 className="text-base font-extrabold text-slate-800 mt-2">Route: {optimizedRoute.start} to {optimizedRoute.destination} ({optimizedRoute.distance} km)</h4>
                  <span className="text-[10px] font-bold text-slate-400 block mt-1">Charging required: {optimizedRoute.energyKwh} kWh</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider block leading-none">Total Saved</span>
                  <span className="text-lg font-black block mt-1">₹ {optimizedRoute.savings.toFixed(0)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Standard Plan */}
                <div className="p-4 bg-white border border-slate-200/50 rounded-2xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Standard Stop Route</span>
                  <div className="flex justify-between items-center text-xs font-extrabold text-slate-850">
                    <span className="truncate">{optimizedRoute.standardStation}</span>
                    <span className="text-rose-500 shrink-0">₹ {optimizedRoute.standardPrice.toFixed(1)}/kWh</span>
                  </div>
                  <span className="text-xs text-slate-500 font-bold block">Energy Cost: ₹ {optimizedRoute.standardCost.toFixed(0)}</span>
                </div>

                {/* Optimized Plan */}
                <div className="p-4 bg-white border border-indigo-200 rounded-2xl space-y-2 shadow-sm shadow-indigo-100">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Cost-Optimized Route</span>
                  </span>
                  <div className="flex justify-between items-center text-xs font-extrabold text-slate-850">
                    <span className="truncate text-indigo-650">{optimizedRoute.optimizedStation}</span>
                    <span className="text-emerald-600 shrink-0">₹ {optimizedRoute.optimizedPrice.toFixed(1)}/kWh</span>
                  </div>
                  <span className="text-xs text-slate-700 font-extrabold block">Energy Cost: ₹ {optimizedRoute.optimizedCost.toFixed(0)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Section C: Live price list of public stations based on selection */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 text-left space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <BatteryCharging className="w-5 h-5 text-emerald-500" />
              <span>Public Charger Prices Directory (Hourly Dynamic Sort)</span>
            </h3>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {sortedStations.map((station) => (
                <div 
                  key={station._id}
                  className="p-3.5 bg-slate-50 border border-slate-200/40 rounded-2xl flex justify-between items-center hover:border-indigo-300 transition-all cursor-pointer"
                >
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 leading-tight">{station.name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-xs">{station.location.address}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-4">
                    <div>
                      <span className="text-sm font-black text-emerald-600 block">₹ {station.livePricePerKwh.toFixed(1)}/kWh</span>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Full Recharge: ₹{station.liveFullCost}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Home Charging Cost Calculator */}
        <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50 text-left space-y-5">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
            <Home className="w-5 h-5 text-indigo-500" />
            <span>Home Charging Cost Calculator</span>
          </h3>

          <div className="space-y-4">
            {/* Standard Tariff Input */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Electricity Tariff (₹ per unit/kWh)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={homeTariff}
                  onChange={(e) => setHomeTariff(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-850 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
                <span className="absolute right-3 top-2 text-slate-400 text-xs font-bold">₹ / Unit</span>
              </div>
            </div>

            {/* Energy Input */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Desired Charge Amount (kWh/Units)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={chargeNeedKwh}
                  onChange={(e) => setChargeNeedKwh(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-850 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
                <span className="absolute right-3 top-2 text-slate-400 text-xs font-bold">kWh (Units)</span>
              </div>
              <button 
                type="button" 
                onClick={() => setChargeNeedKwh(fullChargeUnits)}
                className="mt-1 text-[9px] text-indigo-600 hover:text-indigo-800 font-bold block"
              >
                Set full battery: {fullChargeUnits} Units
              </button>
            </div>

            {/* Calculator output breakdown */}
            <div className="pt-4 border-t border-slate-200/50 space-y-3.5">
              {/* Home charge bill */}
              <div className="flex justify-between items-center text-xs font-bold text-slate-550">
                <span>Estimated Home Charge Bill</span>
                <span className="text-slate-800 font-extrabold">₹ {homeTotalCost.toFixed(0)}</span>
              </div>

              {/* Public equivalent cost */}
              <div className="flex justify-between items-center text-xs font-bold text-slate-550">
                <span>Equivalent Public Cost (Live Hour)</span>
                <span className="text-slate-800 font-extrabold">₹ {publicAvgCost.toFixed(0)}</span>
              </div>

              {/* Total session savings */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between text-emerald-800 text-xs font-bold shadow-sm shadow-emerald-50/50">
                <span className="flex items-center gap-1">
                  <PiggyBank className="w-4 h-4 text-emerald-500" />
                  <span>Money Saved at Home</span>
                </span>
                <span className="text-sm font-black">₹ {homeSavings.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
