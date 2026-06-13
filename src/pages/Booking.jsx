import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStations } from '../context/StationContext';
import { useVehicles } from '../context/VehicleContext';
import { useBookings } from '../context/BookingContext';
import { Calendar, Clock, CreditCard, Receipt, FileText, AlertTriangle, ShieldCheck, Check } from 'lucide-react';

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { stations } = useStations();
  const { vehicles, activeVehicle } = useVehicles();
  const { 
    createBooking, 
    upcomingBookings = [], 
    bookingHistory = [], 
    loading: bookingsLoading, 
    error: bookingsError, 
    cancelBooking 
  } = useBookings();

  const [cancellingId, setCancellingId] = useState(null);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this charging slot reservation?')) {
      return;
    }
    setCancellingId(id);
    const res = await cancelBooking(id);
    setCancellingId(null);
    if (res.success) {
      alert('Reservation cancelled successfully!');
    } else {
      alert('Cancellation failed: ' + res.error);
    }
  };

  // Redirect-state inputs
  const stateStationId = location.state?.stationId || '';
  const stateSlotId = location.state?.slotId || '';
  const statePricing = location.state?.pricing || 15.0;

  // Selected parameters
  const [stationId, setStationId] = useState(stateStationId || (stations[0]?._id || ''));
  const [slotId, setSlotId] = useState(stateSlotId || '');
  const [vehicleId, setVehicleId] = useState(activeVehicle?._id || (vehicles[0]?._id || ''));
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('10:00');
  const [duration, setDuration] = useState(1.0); // in hours
  const [couponCode, setCouponCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Sync state parameters if station lists update
  useEffect(() => {
    if (!stationId && stations.length > 0) {
      setStationId(stations[0]._id);
    }
  }, [stations, stationId]);

  useEffect(() => {
    if (activeVehicle) {
      setVehicleId(activeVehicle._id);
    } else if (!vehicleId && vehicles.length > 0) {
      setVehicleId(vehicles[0]._id);
    }
  }, [activeVehicle, vehicles, vehicleId]);

  const selectedStation = stations.find(s => s._id === stationId);
  const selectedSlot = selectedStation?.slots.find(s => s.id === slotId) || selectedStation?.slots[0];
  const selectedVehicle = vehicles.find(v => v._id === vehicleId);

  // Auto configure slot selection if station changes
  useEffect(() => {
    if (selectedStation && !slotId) {
      const freeSlot = selectedStation.slots.find(sl => sl.status === 'available');
      setSlotId(freeSlot?.id || selectedStation.slots[0]?.id || '');
    }
  }, [stationId, selectedStation, slotId]);

  // Invoice calculations
  const rateKwh = selectedStation ? selectedStation.pricing_per_kWh : statePricing;
  const powerKw = selectedSlot ? selectedSlot.power_kW : 22;
  
  // Projected energy = Power in kW * duration in hrs (assuming 85% charging efficiency)
  const estEnergyTransferred = Number((powerKw * duration * 0.85).toFixed(1));
  const subtotal = Math.round(estEnergyTransferred * rateKwh);
  const taxes = Math.round(subtotal * 0.18); // 18% GST standard in India
  const couponDiscount = discountApplied ? Math.round(subtotal * 0.15) : 0; // 15% discount coupon
  const finalTotal = subtotal + taxes - couponDiscount;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponCode.toLowerCase() === 'green15' || couponCode.toLowerCase() === 'eco15') {
      setDiscountApplied(true);
      alert('15% Discount coupon applied successfully!');
    } else {
      alert('Invalid coupon. Try green15');
    }
  };

  const handleReserve = async () => {
    if (!stationId || !slotId || !vehicleId) {
      alert('Please fill out all booking selections');
      return;
    }

    setConfirming(true);
    const res = await createBooking(
      stationId,
      slotId,
      bookingDate,
      bookingTime,
      duration,
      vehicleId,
      rateKwh
    );
    setConfirming(false);

    if (res.success) {
      alert('Charging slot reserved successfully! Auto invoice printed.');
      navigate('/dashboard');
    } else {
      alert('Reservation failed: ' + res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">Booking</h1>
        <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
          Lock high-speed charging intervals & configure invoices
        </p>
      </div>

      {/* Bookings Error Banner */}
      {bookingsError && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-3xl text-left flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
          <div>
            <h4 className="text-xs font-extrabold text-rose-800 uppercase tracking-wider">Grid Synchronization Error</h4>
            <p className="text-xs font-semibold text-rose-600/90 mt-0.5 leading-relaxed">{bookingsError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left columns: Form selector inputs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50 text-left space-y-5">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <span>Interval Configuration</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Select Station */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Station</label>
                <select
                  id="stationSelect"
                  name="stationSelect"
                  data-testid="station-select"
                  aria-label="Select Station"
                  value={stationId}
                  onChange={(e) => {
                    setStationId(e.target.value);
                    setSlotId('');
                  }}
                  className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-550 focus:border-indigo-500"
                >
                  {stations.map(st => (
                    <option key={st._id} value={st._id}>{st.name}</option>
                  ))}
                </select>
              </div>

              {/* Select Slot */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Charger Slot</label>
                <select
                  id="slotSelect"
                  name="slotSelect"
                  data-testid="slot-select"
                  aria-label="Select Charger Slot"
                  value={slotId}
                  onChange={(e) => setSlotId(e.target.value)}
                  className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-550 focus:border-indigo-500"
                >
                  {selectedStation?.slots.map(sl => (
                    <option key={sl.id} value={sl.id}>
                      {sl.id} — {sl.type} ({sl.power_kW}kW) {sl.status === 'occupied' ? ' (Occupied)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Reservation Date</label>
                <input
                  id="bookingDate"
                  name="bookingDate"
                  data-testid="booking-date-input"
                  aria-label="Reservation Date"
                  type="date"
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                />
              </div>

              {/* Time input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Arrival Time</label>
                <input
                  id="bookingTime"
                  name="bookingTime"
                  data-testid="booking-time-input"
                  aria-label="Arrival Time"
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Select EV profile */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Vehicle Profile</label>
                {vehicles.length === 0 ? (
                  <div className="flex flex-col gap-1 p-2.5 bg-rose-50/50 border border-rose-100 rounded-xl">
                    <span className="text-[10px] font-bold text-rose-600 leading-none">No EV profiles registered.</span>
                    <button
                      type="button"
                      onClick={() => navigate('/settings')}
                      className="text-left text-[10px] font-extrabold text-indigo-600 hover:underline"
                    >
                      + Register an EV in Settings &gt;
                    </button>
                  </div>
                ) : (
                  <select
                    id="vehicleSelect"
                    name="vehicleSelect"
                    data-testid="vehicle-select"
                    aria-label="Select Vehicle Profile"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-550 focus:border-indigo-500"
                  >
                    {vehicles.map(v => (
                      <option key={v._id} value={v._id}>
                        {v.name} {v.plateNumber ? `(${v.plateNumber})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Charging duration */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Charging Duration</label>
                <select
                  id="durationSelect"
                  name="durationSelect"
                  data-testid="duration-select"
                  aria-label="Charging Duration"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                >
                  <option value={0.5}>30 Minutes</option>
                  <option value={1.0}>1 Hour (Standard)</option>
                  <option value={1.5}>1.5 Hours</option>
                  <option value={2.0}>2 Hours</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Coupon Coupon discount */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 text-left">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Redeem Carbon Coins coupon</h3>
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                id="couponCode"
                name="couponCode"
                data-testid="coupon-code-input"
                aria-label="Redeem Carbon Coins coupon"
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter promo coupon code (e.g. green15)"
                className="flex-1 px-4 py-2.5 bg-white/50 border border-slate-200/80 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
              <button
                id="apply-coupon-btn"
                name="apply-coupon-btn"
                data-testid="apply-coupon-button"
                aria-label="Apply Coupon"
                role="button"
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold flex items-center justify-center transition-colors"
              >
                Apply Coupon
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Digital invoice summary */}
        <div className="space-y-4">
          <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50 text-left relative overflow-hidden bg-white">
            
            {/* Holographic lines */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />

            <div className="border-b border-dashed border-slate-200 pb-4 mb-4">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <Receipt className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider leading-none">Invoice Statement</h3>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Smart EV Assistant Booking Terminal
              </p>
            </div>

            {/* Bill details */}
            <div className="space-y-2.5 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Station:</span>
                <span className="text-slate-800 truncate max-w-[150px]">
                  {selectedStation ? selectedStation.name : 'Unknown Hub'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Slot ID:</span>
                <span className="text-slate-850 text-slate-800 font-extrabold">{slotId}</span>
              </div>
              <div className="flex justify-between">
                <span>Vehicle Profile:</span>
                <span className="text-slate-800 truncate max-w-[150px]">
                  {selectedVehicle ? selectedVehicle.name : 'No profile'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Est. Energy Draw:</span>
                <span className="text-slate-800 font-extrabold">{estEnergyTransferred} kWh</span>
              </div>
              
              <div className="border-t border-slate-100 my-2 pt-2 space-y-1.5">
                <div className="flex justify-between">
                  <span>Electricity Base Fee:</span>
                  <span className="text-slate-700">₹ {subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>18% GST (Taxes):</span>
                  <span className="text-slate-700">₹ {taxes}</span>
                </div>
                {discountApplied && (
                  <div className="flex justify-between text-emerald-600">
                    <span>15% Coupon Discount:</span>
                    <span>- ₹ {couponDiscount}</span>
                  </div>
                )}
              </div>

              {/* Total bill price */}
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm font-extrabold text-slate-800">
                <span>Total Amount:</span>
                <span className="text-lg font-black text-indigo-600">₹ {finalTotal}</span>
              </div>
            </div>

            {/* Shield secure checkout indicator */}
            <div className="mt-6 p-3 bg-sky-50 rounded-2xl flex items-center gap-2 border border-sky-100">
              <ShieldCheck className="w-5 h-5 text-sky-500 shrink-0" />
              <span className="text-[10px] font-bold text-sky-700 leading-tight">
                Secure digital slots checkout. Cancel 15 minutes before arrival.
              </span>
            </div>

            <button
              id="book-now-btn"
              name="book-now-btn"
              data-testid="book-now-button"
              aria-label="Book Now"
              role="button"
              onClick={handleReserve}
              disabled={confirming}
              className="w-full mt-4 py-3 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
            >
              {confirming ? 'Securing Grid Slot...' : 'Book Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Grid Bookings Panel */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 text-left mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <span>Real-Time Reservation Ledger</span>
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Live status of your charging slots across the neural grid
            </p>
          </div>
          
          {/* Active status summary badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-sky-50 border border-sky-100 rounded-xl text-xs font-bold text-sky-700">
            <div className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
            <span>Grid Connected Live</span>
          </div>
        </div>

        {bookingsLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest animate-pulse">Syncing reservations...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Upcoming Reservations */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-2">
                Upcoming Grid Slots ({upcomingBookings.length})
              </h4>
              {upcomingBookings.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center">
                  <Clock className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-400">No upcoming charging slots locked.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Select a station and slot above to book.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((b) => (
                    <div key={b._id} className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
                      <div className="text-left space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black uppercase">
                            {b.slotId}
                          </span>
                          <span className="text-xs font-black text-slate-800 font-sans">
                            {b.stationName || 'PulseCharge HyperHub'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold font-sans">
                          {b.stationAddress || 'Linking Road, Bandra West, Mumbai'}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] font-extrabold text-slate-500 mt-2">
                          <span className="flex items-center gap-1 font-sans">
                            <Calendar className="w-3 h-3 text-indigo-500" />
                            {new Date(b.scheduledTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1 font-sans">
                            <Clock className="w-3 h-3 text-indigo-500" />
                            {new Date(b.scheduledTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-slate-400">({b.duration_min} mins)</span>
                        </div>
                      </div>
                      
                      <div className="flex sm:flex-col items-end gap-2 w-full sm:w-auto">
                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                          Active Lock
                        </span>
                        <button
                          onClick={() => handleCancel(b._id)}
                          disabled={cancellingId === b._id}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 hover:border-rose-200 text-rose-600 font-extrabold text-[10px] rounded-xl transition-all w-full sm:w-auto text-center"
                        >
                          {cancellingId === b._id ? 'Releasing...' : 'Cancel Slot'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past & Cancelled Booking History */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest border-l-2 border-slate-300 pl-2">
                Past Charging History ({bookingHistory.length})
              </h4>
              {bookingHistory.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center">
                  <FileText className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-400">No historical reservations logged.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {bookingHistory.map((b) => (
                    <div key={b._id} className="p-4 bg-white border border-slate-200/40 rounded-2xl flex justify-between items-center gap-4 opacity-75 hover:opacity-90 transition-opacity">
                      <div className="text-left space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 rounded text-[8px] font-bold">
                            {b.slotId}
                          </span>
                          <span className="text-xs font-extrabold text-slate-700 font-sans">
                            {b.stationName || 'PulseCharge HyperHub'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                          <span>{new Date(b.scheduledTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          <span>{new Date(b.scheduledTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>₹ {b.paymentId ? 'GST Invoice' : 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {b.status === 'cancelled' ? (
                          <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-500 rounded-lg text-[9px] font-bold uppercase">
                            Cancelled
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-[9px] font-bold uppercase">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
