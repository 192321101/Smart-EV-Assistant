import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useStations } from './StationContext';

const BookingContext = createContext(null);

export const BookingProvider = ({ children }) => {
  const { token, user, updateUserPoints } = useAuth();
  const { updateSlotStatus } = useStations();
  const [bookings, setBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    if (!user) {
      setBookings([]);
      setUpcomingBookings([]);
      setBookingHistory([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [allRes, upcomingRes, historyRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/bookings/upcoming'),
        api.get('/bookings/history')
      ]);
      setBookings(allRes.data.bookings || []);
      setUpcomingBookings(upcomingRes.data.bookings || []);
      setBookingHistory(historyRes.data.bookings || []);
    } catch (err) {
      console.error('❌ [BookingContext] Fetch failed:', err.message);
      setError(err.response?.data?.message || 'Failed to retrieve slot bookings.');
      setBookings([]);
      setUpcomingBookings([]);
      setBookingHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchBookings();
    } else {
      setBookings([]);
      setUpcomingBookings([]);
      setBookingHistory([]);
      setLoading(false);
    }
  }, [user, token]);

  const createBooking = async (stationId, slotId, dateStr, timeStr, durationHours, vehicleId, pricingPerKwh) => {
    const costEstimate = Math.round(pricingPerKwh * 30 * durationHours); // Assume ~30kWh charged per hour
    
    const newBookingData = {
      stationId,
      slotId,
      scheduledTime: new Date(`${dateStr}T${timeStr}`),
      duration_min: durationHours * 60, // Align with backend Booking model duration_min schema
      vehicleId,
      paymentId: `PAY-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
    };

    try {
      const res = await api.post('/bookings', newBookingData);
      const added = res.data.booking;
      // Reload both list filters from server to guarantee sync
      await fetchBookings();
      // Award carbon points
      updateUserPoints(50);
      return { success: true, booking: added };
    } catch (err) {
      console.error('❌ [BookingContext] Create failed:', err.message);
      return { success: false, error: err.response?.data?.message || 'Failed to create booking.' };
    }
  };

  const cancelBooking = async (id, stationId, slotId) => {
    try {
      await api.put(`/bookings/${id}/cancel`);
      // Reload all filters from server to guarantee sync
      await fetchBookings();
      return { success: true };
    } catch (err) {
      console.error('❌ [BookingContext] Cancel failed:', err.message);
      return { success: false, error: err.response?.data?.message || 'Failed to cancel booking.' };
    }
  };

  return (
    <BookingContext.Provider value={{ 
      bookings, 
      upcomingBookings, 
      bookingHistory, 
      loading, 
      error, 
      createBooking, 
      cancelBooking, 
      fetchBookings 
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBookings = () => useContext(BookingContext);
export default BookingContext;
