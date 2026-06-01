import React, { useState, useEffect } from 'react';
import { 
  CloudRain, 
  CloudLightning, 
  CloudSnow, 
  Sun, 
  CloudFog, 
  Thermometer, 
  Wind, 
  Droplets, 
  Gauge, 
  AlertTriangle, 
  BatteryCharging, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  MapPin, 
  Info,
  Navigation,
  RefreshCw,
  Zap
} from 'lucide-react';

export default function WeatherAlert() {
  const [currentCoords, setCurrentCoords] = useState(() => {
    const saved = localStorage.getItem('ev_current_coords');
    try {
      return saved ? JSON.parse(saved) : [80.0945, 13.0473]; // Default: Poonamallee
    } catch (e) {
      return [80.0945, 13.0473];
    }
  });

  const [activeWeatherMode, setActiveWeatherMode] = useState('pleasant'); // storm, heatwave, fog, pleasant
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [liveWeatherData, setLiveWeatherData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [lastSpeech, setLastSpeech] = useState('');

  // Auto-detect city name
  const getCityName = () => {
    const lng = currentCoords[0];
    if (lng > 79 && lng < 81) return 'Poonamallee, Chennai';
    if (lng > 72 && lng < 74) return 'Bandra, Mumbai';
    return 'Transit Highway Corridor';
  };

  const fetchLiveWeather = async (lng, lat) => {
    setLoadingWeather(true);
    setWeatherError(null);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
      );
      const data = await response.json();
      if (data && data.current) {
        setLiveWeatherData(data.current);
        
        // Determine the mode dynamically based on temperature and weather code
        const temp = data.current.temperature_2m;
        const code = data.current.weather_code;
        
        let newMode = 'pleasant';
        if (temp >= 35) {
          newMode = 'heatwave';
        } else if (code === 45 || code === 48) {
          newMode = 'fog';
        } else if (code === 95 || code === 96 || code === 99 || (code >= 80 && code <= 82) || (code >= 51 && code <= 65)) {
          newMode = 'storm';
        }
        
        setActiveWeatherMode(newMode);
      } else {
        setWeatherError('No weather data returned from live server.');
      }
    } catch (e) {
      console.warn('Failed to fetch live weather details', e);
      setWeatherError('Live weather lookup failed. Defaulting to simulation presets.');
      setIsLiveMode(false);
    } finally {
      setLoadingWeather(false);
    }
  };

  // Re-fetch weather if location or mode changes
  useEffect(() => {
    if (isLiveMode && currentCoords) {
      fetchLiveWeather(currentCoords[0], currentCoords[1]);
    }
  }, [currentCoords, isLiveMode]);

  const weatherPresets = {
    pleasant: {
      name: 'Pleasant & Clear Skies',
      temp: 26,
      humidity: 50,
      wind: 12,
      visibility: '10 km',
      icon: Sun,
      iconColor: 'text-amber-500',
      bannerBg: 'from-amber-500/10 to-sky-500/10 border-amber-200/50',
      description: 'Optimal driving conditions across all routes. Minimum battery thermal load.',
      hvacLoad: 'Low (Auto Mode)',
      chargingAdvice: 'DC Fast charging operational at max speed (100% capacity). No thermal throttling.',
      safetyWarnings: [
        'No active weather hazards on highway corridors.',
        'Battery temperature remains in optimal zone (25-32°C).'
      ],
      routeStatus: [
        { place: 'NH 48 Bypass', status: 'Clear', color: 'text-emerald-500' },
        { place: 'Sriperumbudur Transit', status: 'Optimal', color: 'text-emerald-500' },
        { place: 'ECR Coastal highway', status: 'Clear', color: 'text-emerald-500' }
      ]
    },
    heatwave: {
      name: 'Severe Heatwave Alert',
      temp: 42,
      humidity: 30,
      wind: 18,
      visibility: '8 km',
      icon: Sun,
      iconColor: 'text-orange-600',
      bannerBg: 'from-orange-500/20 to-rose-500/10 border-orange-200/50',
      description: 'Extreme temperatures detected. Heavy air conditioning load and battery thermal management active.',
      hvacLoad: 'High (Cooling Max)',
      chargingAdvice: 'DC Hypercharger speeds throttled to 80kW (instead of 150kW) to prevent cell overheating. AC charging recommended.',
      safetyWarnings: [
        'Extreme Heat Alert: Avoid leaving the vehicle parked under direct sunlight.',
        'Coolant Temp High: Battery cooling fans will remain active post-charging.',
        'Tire Pressure Warning: Asphalt heat increases tire pressure. Verify cold pressure bounds.'
      ],
      routeStatus: [
        { place: 'NH 48 Bypass', status: 'Asphalt Temp: 58°C', color: 'text-orange-500' },
        { place: 'Sriperumbudur Transit', status: 'Thermal Warning', color: 'text-amber-500' },
        { place: 'ECR Coastal highway', status: 'High Cabin HVAC Load', color: 'text-amber-500' }
      ]
    },
    storm: {
      name: 'Monsoon Heavy Thunderstorms',
      temp: 24,
      humidity: 95,
      wind: 45,
      visibility: '1.5 km',
      icon: CloudLightning,
      iconColor: 'text-indigo-600 animate-pulse',
      bannerBg: 'from-indigo-500/20 to-sky-500/10 border-indigo-200/50',
      description: 'Heavy precipitation and strong gusty winds. Risk of localized road flooding and waterlogging.',
      hvacLoad: 'Medium (Defogger Max)',
      chargingAdvice: 'Do not charge at outdoor unshaded DC units during active lightning strikes. Ensure connector plug cover is completely dry.',
      safetyWarnings: [
        'Waterlogging Risk: EV batteries are IP67 sealed, but driving through standing water deeper than 30cm is NOT recommended.',
        'Rolling Resistance: Wet asphalt reduces tire grip and range efficiency by 8%. Defogger active.',
        'Braking Distance: Regenerative braking might be automatically reduced on slippery roads. Apply manual brakes early.'
      ],
      routeStatus: [
        { place: 'NH 48 Bypass', status: 'Waterlogged Lanes (Slow)', color: 'text-rose-500' },
        { place: 'Sriperumbudur Transit', status: 'Flash Rain Warnings', color: 'text-rose-500' },
        { place: 'ECR Coastal highway', status: 'Wind Gusts 50km/h', color: 'text-amber-500' }
      ]
    },
    fog: {
      name: 'Dense Winter Fog',
      temp: 14,
      humidity: 88,
      wind: 6,
      visibility: '150 meters',
      icon: CloudFog,
      iconColor: 'text-slate-400',
      bannerBg: 'from-slate-400/20 to-blue-500/10 border-slate-300/50',
      description: 'Extremely poor visibility on highway sections. Automatic safety system range adjustments.',
      hvacLoad: 'Medium (Cabin Heating)',
      chargingAdvice: 'Standard DC charging rates active. Condensation check recommended on high-voltage sockets.',
      safetyWarnings: [
        'Fog warning: Limit highway speeds to 50 km/h. Keep hazard lights active.',
        'Radar Obstruction: Dynamic radar cruise control and front ADAS collision sensors may have reduced accuracy.',
        'Cabin heater active: Heating consumes ~1.5kW power directly from main battery pack.'
      ],
      routeStatus: [
        { place: 'NH 48 Bypass', status: 'Visibility <200m', color: 'text-rose-500' },
        { place: 'Sriperumbudur Transit', status: 'Dense Fog patches', color: 'text-rose-500' },
        { place: 'ECR Coastal highway', status: 'Medium Fog', color: 'text-amber-500' }
      ]
    }
  };

  const baseWeather = weatherPresets[activeWeatherMode];
  const WeatherIcon = baseWeather.icon;

  // Compute live properties
  const displayTemp = isLiveMode && liveWeatherData ? Math.round(liveWeatherData.temperature_2m) : baseWeather.temp;
  const displayHumidity = isLiveMode && liveWeatherData ? liveWeatherData.relative_humidity_2m : baseWeather.humidity;
  const displayWind = isLiveMode && liveWeatherData ? Math.round(liveWeatherData.wind_speed_10m) : baseWeather.wind;
  
  // Custom Dynamic Range Impact Formula
  const getRangeImpact = (temp, mode) => {
    let impact = 0;
    if (temp >= 40) {
      impact -= 14;
    } else if (temp >= 35) {
      impact -= 10;
    } else if (temp > 30) {
      impact -= 5;
    } else if (temp < 12) {
      impact -= 8;
    }
    
    if (mode === 'storm') {
      impact -= 8; // wet road resistance
    }
    return impact;
  };

  const rangeImpact = getRangeImpact(displayTemp, activeWeatherMode);

  const speakVoiceReport = () => {
    if (isMuted) return;
    const weatherString = isLiveMode ? `The live weather in ${getCityName()} is currently ${displayTemp} degrees Celsius with ${activeWeatherMode === 'pleasant' ? 'clear skies' : activeWeatherMode}.` : `Simulated weather is ${weatherPresets[activeWeatherMode].name}.`;
    const rangeString = rangeImpact < 0 ? `The range efficiency of your electric vehicle is reduced by ${Math.abs(rangeImpact)} percent due to climate loads.` : `Your electric vehicle is operating at peak range efficiency.`;
    const text = `EV Copilot weather update. ${weatherString} ${rangeString} Safety advisory: ${baseWeather.safetyWarnings[0]}`;
    
    setLastSpeech(text);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    speakVoiceReport();
  }, [activeWeatherMode, isLiveMode, liveWeatherData]);

  const handleRefreshLive = () => {
    setIsLiveMode(true);
    fetchLiveWeather(currentCoords[0], currentCoords[1]);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <CloudLightning className="w-7 h-7 text-indigo-500 animate-pulse" />
            <span>EV Weather Copilot</span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Live weather telemetry & battery efficiency diagnostics
          </p>
        </div>

        {/* Voice Advisory Button */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="flex items-center justify-center p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
            title={isMuted ? "Unmute Copilot Voice" : "Mute Copilot Voice"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-indigo-500" />}
          </button>
          
          <button
            onClick={handleRefreshLive}
            disabled={loadingWeather}
            className={`flex items-center gap-1.5 px-3 py-2 ${isLiveMode ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'} rounded-xl text-xs font-bold transition-all`}
          >
            <RefreshCw className={`w-4 h-4 ${loadingWeather && 'animate-spin'}`} />
            <span>{isLiveMode ? 'Live Weather: ON' : 'Sync Live Weather'}</span>
          </button>
        </div>
      </div>

      {/* Simulator / Mode Controls */}
      <div className="glass-panel p-4 rounded-3xl border border-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weather Mode:</span>
          {isLiveMode ? (
            <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1 animate-pulse">
              <Zap className="w-3 h-3 fill-indigo-500" />
              <span>Real-Time Weather Active</span>
            </span>
          ) : (
            <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-100 rounded-full text-[9px] font-extrabold text-amber-600 uppercase tracking-wider">
              Simulation Preset Mode
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => {
              setIsLiveMode(false);
              setActiveWeatherMode('pleasant');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !isLiveMode && activeWeatherMode === 'pleasant' ? 'bg-amber-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            ☀️ Pleasant (26°C)
          </button>
          <button
            onClick={() => {
              setIsLiveMode(false);
              setActiveWeatherMode('heatwave');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !isLiveMode && activeWeatherMode === 'heatwave' ? 'bg-orange-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            🔥 Heatwave (42°C)
          </button>
          <button
            onClick={() => {
              setIsLiveMode(false);
              setActiveWeatherMode('storm');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !isLiveMode && activeWeatherMode === 'storm' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            ⛈️ Heavy Storm
          </button>
          <button
            onClick={() => {
              setIsLiveMode(false);
              setActiveWeatherMode('fog');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !isLiveMode && activeWeatherMode === 'fog' ? 'bg-slate-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            🌫️ Dense Fog
          </button>
        </div>
      </div>

      {weatherError && (
        <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-700 font-bold text-left flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>{weatherError}</span>
        </div>
      )}

      {/* Main Grid: Weather Telemetry Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card A: Weather Summary Info */}
        <div className={`lg:col-span-2 glass-panel p-6 rounded-3xl border bg-gradient-to-r ${baseWeather.bannerBg} flex flex-col justify-between text-left space-y-6`}>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Active Location: {getCityName()}</span>
              </span>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-1">{isLiveMode ? `Live: ${baseWeather.name}` : baseWeather.name}</h2>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-md">
                {isLiveMode ? `Real-world coordinates [${currentCoords[0].toFixed(4)}, ${currentCoords[1].toFixed(4)}] live telemetry feed enabled.` : baseWeather.description}
              </p>
            </div>
            
            {/* Big Weather Icon & Temperature Display */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white/70 shadow-sm border border-slate-200/40 flex items-center justify-center">
                <WeatherIcon className={`w-10 h-10 ${baseWeather.iconColor}`} />
              </div>
              <div className="text-left">
                <span className="text-4xl font-black text-slate-800 leading-none">{displayTemp}°C</span>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Outside Temp</span>
              </div>
            </div>
          </div>

          {/* Core Meteorology Grid */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200/30">
            <div className="p-3 bg-white/80 border border-slate-200/20 rounded-2xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Humidity</span>
              <div className="flex items-center gap-1 mt-1 text-slate-700 font-extrabold text-sm">
                <Droplets className="w-4 h-4 text-sky-500" />
                <span>{displayHumidity}%</span>
              </div>
            </div>
            <div className="p-3 bg-white/80 border border-slate-200/20 rounded-2xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Wind Speed</span>
              <div className="flex items-center gap-1 mt-1 text-slate-700 font-extrabold text-sm">
                <Wind className="w-4 h-4 text-emerald-500" />
                <span>{displayWind} km/h</span>
              </div>
            </div>
            <div className="p-3 bg-white/80 border border-slate-200/20 rounded-2xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Visibility</span>
              <div className="flex items-center gap-1 mt-1 text-slate-700 font-extrabold text-sm">
                <Gauge className="w-4 h-4 text-purple-500" />
                <span>{baseWeather.visibility}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card B: EV Impact Analysis */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 text-left flex flex-col justify-between space-y-5">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-1.5 uppercase tracking-wider">
              <BatteryCharging className="w-5 h-5 text-emerald-500" />
              <span>EV Performance Impact</span>
            </h3>
            
            <div className="space-y-4">
              {/* Range degradation percentage bubble */}
              <div className="p-4 rounded-2xl border flex items-center justify-between gap-4 bg-slate-50 border-slate-200/50">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Max Range Impact</span>
                  <span className={`text-base font-black ${rangeImpact < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {rangeImpact}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">HVAC Cabin Draw</span>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">{baseWeather.hvacLoad}</span>
                </div>
              </div>

              {/* Charging Advice card */}
              <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/20 text-xs font-bold text-slate-700 flex items-start gap-2.5">
                <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] font-extrabold text-amber-600 uppercase tracking-wider block">Charging Advisory</span>
                  <p className="text-slate-600 font-semibold mt-1 leading-normal">{baseWeather.chargingAdvice}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-50 p-2 rounded-xl border border-slate-200/30 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Optimal battery temp: 28°C</span>
          </div>
        </div>
      </div>

      {/* Grid: Route Advisories & Alerts logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Columns: Severe Safety warnings list */}
        <div className="lg:col-span-2 glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50 text-left space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-extrabold">
            <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />
            <span>EV Diagnostics & Safety Warnings</span>
          </h3>

          <div className="space-y-3">
            {baseWeather.safetyWarnings.map((warning, index) => (
              <div key={index} className="p-4 rounded-2xl border border-rose-100/50 bg-rose-50/20 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-slate-700 leading-normal">{warning}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Route status by transit point */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 text-left space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-indigo-500" />
            <span>Transit Corridor Status</span>
          </h3>

          <div className="space-y-2.5">
            {baseWeather.routeStatus.map((segment, index) => (
              <div key={index} className="p-3 bg-slate-50/70 border border-slate-200/40 rounded-2xl flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 leading-tight">{segment.place}</h4>
                  <span className="text-[9px] text-slate-400 font-semibold">Active highway monitor</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 bg-white border border-slate-200/50 ${segment.color}`}>
                  {segment.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
