import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useTelemetry } from './TelemetryContext';

const StationContext = createContext(null);

export const StationProvider = ({ children }) => {
  const { token } = useAuth();
  const { socket } = useTelemetry() || {};
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    connectorType: 'all',
    minPower: 0,
    operator: 'all',
    onlyAvailable: false
  });

  const fetchStations = async (coords) => {
    if (!token) {
      setStations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let lng = 80.0945;
      let lat = 13.0473;
      
      if (coords && coords.length === 2) {
        lng = coords[0];
        lat = coords[1];
      } else {
        const saved = localStorage.getItem('ev_current_coords');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.length === 2) {
              lng = parsed[0];
              lat = parsed[1];
            }
          } catch (e) {
            console.warn('Failed to parse ev_current_coords from localStorage:', e);
          }
        }
      }

      // Build query string based on filters with a large maxDistance to fetch all stations in India
      let query = `/stations/nearby?lng=${lng}&lat=${lat}&maxDistance=5000000`;
      if (filters.connectorType !== 'all') {
        query += `&connectorType=${filters.connectorType}`;
      }
      if (filters.minPower > 0) {
        query += `&minPower=${filters.minPower}`;
      }
      if (filters.onlyAvailable) {
        query += `&onlyAvailable=true`;
      }
      
      const res = await api.get(query);
      setStations(res.data.stations || []);
    } catch (err) {
      console.error('❌ [StationContext] Fetch failed:', err.message);
      setStations([]);
    }
    setLoading(false);
  };

  // Fetch stations when token or filters change
  useEffect(() => {
    fetchStations();
  }, [token, filters.connectorType, filters.minPower, filters.onlyAvailable]);

  // Listen to Socket.IO real-time availability broadcasts
  useEffect(() => {
    if (!socket) return;

    console.log('📡 [StationContext] Subscribed to realtime station slot status updates.');

    const handleStatusUpdate = ({ stationId, slotId, status }) => {
      console.log(`🔌 [Socket.io Event] Slot Status changed: Station ${stationId}, Slot ${slotId} -> ${status}`);
      setStations(prev => prev.map(s => {
        if (s._id === stationId) {
          return {
            ...s,
            slots: s.slots.map(sl => sl.id === slotId ? { ...sl, status } : sl)
          };
        }
        return s;
      }));
    };

    socket.on('station:status_update', handleStatusUpdate);

    return () => {
      socket.off('station:status_update', handleStatusUpdate);
    };
  }, [socket]);

  const getStationById = (id) => {
    return stations.find(s => s._id === id);
  };

  const updateSlotStatus = async (stationId, slotId, newStatus) => {
    try {
      await api.put(`/stations/${stationId}/slots/${slotId}`, { status: newStatus });
      // Update locally immediately for responsiveness
      setStations(prev => prev.map(s => {
        if (s._id === stationId) {
          return {
            ...s,
            slots: s.slots.map(sl => sl.id === slotId ? { ...sl, status: newStatus } : sl)
          };
        }
        return s;
      }));
    } catch (err) {
      console.error('❌ [StationContext] Failed to override slot status:', err.message);
    }
  };

  const submitReview = async (stationId, rating, comment) => {
    try {
      const res = await api.post(`/stations/${stationId}/reviews`, { rating, comment });
      if (res.data.success) {
        setStations(prev => prev.map(s => {
          if (s._id === stationId) {
            return {
              ...s,
              reviews: res.data.reviews,
              rating: res.data.rating,
              reviewsCount: res.data.reviewsCount
            };
          }
          return s;
        }));
        return { success: true };
      }
    } catch (err) {
      console.error('❌ [StationContext] Submit review failed:', err.message);
      return { success: false, error: err.response?.data?.message || 'Failed to submit review' };
    }
  };

  return (
    <StationContext.Provider value={{
      stations,
      loading,
      filters,
      setFilters,
      fetchStations,
      getStationById,
      updateSlotStatus,
      submitReview
    }}>
      {children}
    </StationContext.Provider>
  );
};

export const useStations = () => useContext(StationContext);
export default StationContext;
