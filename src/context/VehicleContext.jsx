import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const VehicleContext = createContext(null);

export const VehicleProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!user) {
        setVehicles([]);
        setActiveVehicle(null);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/vehicles');
        const fetchedVehicles = res.data.vehicles || [];
        setVehicles(fetchedVehicles);
        const defaultVehicle = fetchedVehicles.find(v => v.isDefault) || fetchedVehicles[0];
        setActiveVehicle(defaultVehicle || null);
      } catch (err) {
        console.error('❌ [VehicleContext] Fetch failed:', err.message);
        setVehicles([]);
        setActiveVehicle(null);
      }
      setLoading(false);
    };

    if (token && user) {
      fetchVehicles();
    } else {
      setVehicles([]);
      setActiveVehicle(null);
      setLoading(false);
    }
  }, [user, token]);

  const selectActiveVehicle = (id) => {
    const selected = vehicles.find(v => v._id === id);
    if (selected) {
      setActiveVehicle(selected);
    }
  };

  const addVehicle = async (newVehicleData) => {
    try {
      const res = await api.post('/vehicles', newVehicleData);
      const added = res.data.vehicle;
      const updated = [...vehicles, added];
      setVehicles(updated);
      if (added.isDefault || vehicles.length === 0) {
        setActiveVehicle(added);
      }
      return { success: true, vehicle: added };
    } catch (err) {
      console.error('❌ [VehicleContext] Add failed:', err.message);
      return { success: false, error: err.response?.data?.message || 'Failed to add vehicle' };
    }
  };

  const deleteVehicle = async (id) => {
    try {
      await api.delete(`/vehicles/${id}`);
      const updated = vehicles.filter(v => v._id !== id);
      setVehicles(updated);
      if (activeVehicle?._id === id) {
        setActiveVehicle(updated.find(v => v.isDefault) || updated[0] || null);
      }
      return { success: true };
    } catch (err) {
      console.error('❌ [VehicleContext] Delete failed:', err.message);
      return { success: false, error: err.response?.data?.message || 'Failed to delete vehicle' };
    }
  };

  const updateBatteryTelemetry = async (chargePercent) => {
    if (!activeVehicle) return;
    const updatedRange = Math.round(activeVehicle.batteryCapacity_kWh * 6.5 * (chargePercent / 100));
    
    // Update locally immediately for responsiveness
    const updatedVehicle = {
      ...activeVehicle,
      currentCharge_percent: chargePercent,
      range_km: updatedRange
    };
    
    const updatedList = vehicles.map(v => v._id === activeVehicle._id ? updatedVehicle : v);
    setVehicles(updatedList);
    setActiveVehicle(updatedVehicle);

    try {
      await api.put(`/vehicles/${activeVehicle._id}/battery`, {
        batteryPercent: chargePercent
      });
    } catch (err) {
      console.error('❌ [VehicleContext] Sync battery percent failed:', err.message);
    }
  };

  const overrideActiveVehicleRange = (newRange) => {
    if (!activeVehicle) return;
    const updatedVehicle = {
      ...activeVehicle,
      range_km: newRange
    };
    setActiveVehicle(updatedVehicle);
    const updatedList = vehicles.map(v => v._id === activeVehicle._id ? updatedVehicle : v);
    setVehicles(updatedList);
  };

  const updateVehicle = async (id, updatedData) => {
    try {
      const res = await api.put(`/vehicles/${id}`, updatedData);
      const updated = res.data.vehicle;
      
      const updatedList = vehicles.map(v => v._id === id ? updated : v);
      
      if (updated.isDefault) {
        updatedList.forEach(v => {
          if (v._id !== id) v.isDefault = false;
        });
      }
      
      setVehicles(updatedList);
      
      if (activeVehicle?._id === id || updated.isDefault) {
        setActiveVehicle(updated);
      }
      
      return { success: true, vehicle: updated };
    } catch (err) {
      console.error('❌ [VehicleContext] Update failed:', err.message);
      return { success: false, error: err.response?.data?.message || 'Failed to update vehicle' };
    }
  };

  const setVehicleDefault = async (id) => {
    try {
      const res = await api.put(`/vehicles/${id}/default`);
      const updated = res.data.vehicle;
      
      const updatedList = vehicles.map(v => {
        if (v._id === id) return updated;
        return { ...v, isDefault: false };
      });
      
      setVehicles(updatedList);
      setActiveVehicle(updated);
      
      return { success: true, vehicle: updated };
    } catch (err) {
      console.error('❌ [VehicleContext] Set default failed:', err.message);
      return { success: false, error: err.response?.data?.message || 'Failed to set default vehicle' };
    }
  };

  return (
    <VehicleContext.Provider value={{
      vehicles,
      activeVehicle,
      loading,
      selectActiveVehicle,
      addVehicle,
      deleteVehicle,
      updateBatteryTelemetry,
      overrideActiveVehicleRange,
      updateVehicle,
      setVehicleDefault
    }}>
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicles = () => useContext(VehicleContext);
export default VehicleContext;
