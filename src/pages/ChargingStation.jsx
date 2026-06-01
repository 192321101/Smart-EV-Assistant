import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStations } from '../context/StationContext';
import { useTelemetry } from '../context/TelemetryContext';
import { Search, SlidersHorizontal, MapPin, Zap, Star, Compass, Coins, CheckCircle, Clock } from 'lucide-react';

export default function ChargingStation() {
  const navigate = useNavigate();
  const { stations, filters, setFilters, loading, submitReview, fetchStations } = useStations();
  const { startChargingSession, activeSession } = useTelemetry();
  
  const [selectedStation, setSelectedStation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [currentCoords, setCurrentCoords] = useState(() => {
    const saved = localStorage.getItem('ev_current_coords');
    try {
      return saved ? JSON.parse(saved) : [80.0945, 13.0473];
    } catch (e) {
      return [80.0945, 13.0473];
    }
  });
  const [filterWithin15km, setFilterWithin15km] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('ev_current_coords');
    let coords = [80.0945, 13.0473];
    if (saved) {
      try {
        coords = JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse ev_current_coords from localStorage', e);
      }
    }
    
    if (navigator.geolocation && !saved) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCoords = [pos.coords.longitude, pos.coords.latitude];
          setCurrentCoords(newCoords);
          localStorage.setItem('ev_current_coords', JSON.stringify(newCoords));
          fetchStations(newCoords);
        },
        (err) => {
          console.warn('Geolocation fallback to Poonamallee defaults.');
          setCurrentCoords(coords);
          fetchStations(coords);
        }
      );
    } else {
      setCurrentCoords(coords);
      fetchStations(coords);
    }
  }, []);

  const getDistance = (coords1, coords2) => {
    if (!coords1 || !coords2) return 0;
    const rawDist = Math.sqrt(
      Math.pow(coords2[0] - coords1[0], 2) +
      Math.pow(coords2[1] - coords1[1], 2)
    );
    return Number((rawDist * 150).toFixed(1)); // in km
  };

  const handleStationClick = (station) => {
    // Keep reference updated if reviews are refreshed
    const freshStation = stations.find(s => s._id === station._id) || station;
    setSelectedStation(freshStation);
  };

  const handleReserveSlot = (stationId, slotId, pricing) => {
    navigate('/booking', { state: { stationId, slotId, pricing } });
  };

  const handlePlugInMock = (stationId, slotId, pricing, powerKw) => {
    startChargingSession(stationId, slotId, pricing, powerKw >= 50);
    navigate('/dashboard');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStation) return;
    if (!reviewComment.trim()) return;

    const res = await submitReview(selectedStation._id, newRating, reviewComment);
    if (res && res.success) {
      // Refresh local selectedStation details in sidebar view
      const updatedStation = stations.find(s => s._id === selectedStation._id);
      if (updatedStation) {
        setSelectedStation({
          ...updatedStation,
          reviews: [...(updatedStation.reviews || []), { userName: 'You', rating: newRating, comment: reviewComment }],
          reviewsCount: (updatedStation.reviewsCount || 0) + 1,
          rating: parseFloat(((((updatedStation.rating || 4.5) * (updatedStation.reviewsCount || 0)) + newRating) / ((updatedStation.reviewsCount || 0) + 1)).toFixed(1))
        });
      }
      setReviewComment('');
    } else {
      alert(res?.error || 'Failed to submit review');
    }
  };

  const filteredStations = stations.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.operator.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterWithin15km) {
      if (!s.location || !s.location.coordinates) return false;
      const distance = getDistance(currentCoords, s.location.coordinates);
      return distance <= 15;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Charging Station Network</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Explore nearby Fast DC hyperchargers and reserved slot systems
          </p>
        </div>
      </div>

      {/* Discovery Hub controls */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stations, address, operator..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/60 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          {/* Radius Filter Toggle */}
          <button
            onClick={() => setFilterWithin15km(!filterWithin15km)}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
              filterWithin15km ? 'bg-sky-500 text-white border-sky-500 shadow-sm shadow-sky-500/10' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Within 15km of Current Location</span>
          </button>

          {/* Filter Toggle Trigger */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
              showFilters ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Advanced Filters</span>
          </button>
        </div>
      </div>

      {/* Filter panel drawer (shown when toggled) */}
      {showFilters && (
        <div className="glass-panel p-4 rounded-3xl border border-slate-200/50 grid grid-cols-1 sm:grid-cols-4 gap-4 text-left animate-fade-in">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Connector Port</label>
            <select
              value={filters.connectorType}
              onChange={(e) => setFilters({ ...filters, connectorType: e.target.value })}
              className="w-full py-1.5 px-2 bg-white/80 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              <option value="all">All Port Types</option>
              <option value="CCS">DC Fast (CCS)</option>
              <option value="Type 2">AC Fast (Type 2)</option>
              <option value="CHAdeMO">CHAdeMO</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Min Power Rating</label>
            <select
              value={filters.minPower}
              onChange={(e) => setFilters({ ...filters, minPower: Number(e.target.value) })}
              className="w-full py-1.5 px-2 bg-white/80 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              <option value={0}>All Charger Speeds</option>
              <option value={22}>AC & Above (&gt;22kW)</option>
              <option value={50}>DC Fast (&gt;50kW)</option>
              <option value={150}>DC Ultra/Hyper (&gt;150kW)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Charger Availability</label>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.onlyAvailable}
                onChange={(e) => setFilters({ ...filters, onlyAvailable: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-700">Available Slots Only</span>
            </label>
          </div>

          <div className="flex items-end justify-end">
            <button
              onClick={() => setFilters({ connectorType: 'all', minPower: 0, operator: 'all', onlyAvailable: false })}
              className="text-xs font-bold text-rose-500 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Stations List & Active Slots drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left Side: Station Listings */}
        <div className="xl:col-span-2 space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-450 text-slate-450 text-slate-400 uppercase tracking-widest">
                Scanning local power grids...
              </p>
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="glass-panel text-center py-12 rounded-3xl border border-slate-200/50">
              <p className="text-slate-450 font-bold text-sm">No charging stations match your criteria</p>
            </div>
          ) : (
            filteredStations.map((station) => {
              const totalSlots = station.slots.length;
              const occupied = station.slots.filter(sl => sl.status === 'occupied').length;
              const freeSlots = totalSlots - occupied;

              return (
                <div
                  key={station._id}
                  onClick={() => handleStationClick(station)}
                  className={`glass-panel p-5 rounded-3xl text-left border cursor-pointer hover:border-indigo-400/50 hover:shadow-md transition-all duration-300 ${
                    selectedStation?._id === station._id ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-250 border-slate-200/40'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800">{station.name}</h3>
                      <p className="text-xs text-slate-400 font-semibold mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{station.location.address}</span>
                      </p>
                    </div>

                    {/* Distance & Ratings */}
                    <div className="flex items-center gap-2">
                      {station.location && station.location.coordinates && (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-sky-50 rounded-xl text-sky-700 text-xs font-extrabold border border-sky-100/50">
                          <MapPin className="w-3.5 h-3.5 text-sky-500" />
                          <span>{getDistance(currentCoords, station.location.coordinates)} km</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-xl text-amber-700 text-xs font-extrabold border border-amber-100/50">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{station.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Grid details */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-200/30">
                    <div className="flex gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pricing</span>
                        <span className="text-sm font-extrabold text-slate-800">₹ {station.pricing_per_kWh}/kWh</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Slots Availability</span>
                        <span className={`text-sm font-extrabold ${freeSlots > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {freeSlots > 0 ? `${freeSlots} of ${totalSlots} Free` : 'Station Full'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {station.amenities.slice(0, 3).map(a => (
                        <span key={a} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Slots Details drawer panel */}
        <div className="space-y-4">
          {selectedStation ? (
            <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50 text-left space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-850 text-slate-800 leading-none">{selectedStation.name}</h3>
                <span className="text-[10px] font-bold text-slate-400 block mt-1 uppercase tracking-wider">
                  Operator: {selectedStation.operator}
                </span>
              </div>

              {/* Slots List */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-extrabold">Charger Slots Grid</h4>
                {selectedStation.slots.map((slot) => {
                  const isOccupied = slot.status === 'occupied';
                  return (
                    <div
                      key={slot.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all duration-300 ${
                        isOccupied ? 'bg-slate-50 border-slate-200/50' : 'bg-white border-emerald-100 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOccupied ? 'bg-slate-200 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                          <Zap className={`w-5 h-5 ${!isOccupied && 'animate-pulse'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-extrabold text-slate-850 text-slate-800">{slot.id}</span>
                            <span className="text-[10px] font-bold text-slate-400">({slot.power_kW} kW)</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">{slot.type}</span>
                        </div>
                      </div>

                      {/* Action status button */}
                      <div>
                        {isOccupied ? (
                          <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5" />
                            <span>OCCUPIED</span>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-1.5">
                            <button
                              onClick={() => handlePlugInMock(selectedStation._id, slot.id, selectedStation.pricing_per_kWh, slot.power_kW)}
                              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-[10px] font-extrabold tracking-wide uppercase transition-colors"
                              disabled={!!activeSession}
                              title={activeSession ? 'Stop current session first' : 'Plug in vehicle'}
                            >
                              Charge
                            </button>
                            <button
                              onClick={() => handleReserveSlot(selectedStation._id, slot.id, selectedStation.pricing_per_kWh)}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-extrabold tracking-wide uppercase transition-colors"
                            >
                              Book
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reviews and Ratings panel */}
              <div className="pt-5 border-t border-slate-200/50 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-extrabold">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span>Driver Feedback ({selectedStation.reviewsCount || 0})</span>
                </h4>
                
                {/* Reviews List */}
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {!selectedStation.reviews || selectedStation.reviews.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-semibold italic">No driver reviews yet. Be the first to leave one!</p>
                  ) : (
                    selectedStation.reviews.map((rev, index) => (
                      <div key={rev._id || index} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/40 text-left">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-slate-700">{rev.userName}</span>
                          <span className="text-amber-600 flex items-center gap-0.5 font-extrabold">
                            {rev.rating} ★
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1 leading-relaxed">{rev.comment}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Submit review form */}
                <form onSubmit={handleReviewSubmit} className="pt-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Your Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((stars) => (
                        <button
                          key={stars}
                          type="button"
                          onClick={() => setNewRating(stars)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs transition-colors ${
                            newRating >= stars ? 'bg-amber-500 text-white font-black' : 'bg-slate-100 hover:bg-slate-200 text-slate-450'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Leave a review comment..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-[10px] font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl text-[10px] font-extrabold tracking-wider uppercase shadow-md shadow-indigo-500/10 hover:opacity-95 transition-opacity"
                  >
                    Submit Feedback
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-8 text-center rounded-3xl border border-slate-200/50 min-h-[300px] flex flex-col items-center justify-center">
              <Compass className="w-12 h-12 text-slate-350 text-slate-300 mb-3 animate-bounce" />
              <h4 className="text-sm font-bold text-slate-800">No Station Selected</h4>
              <p className="text-[11px] font-semibold text-slate-400 max-w-xs mt-1 leading-relaxed">
                Click on any station card or map pin to open its live grid slot overview.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
