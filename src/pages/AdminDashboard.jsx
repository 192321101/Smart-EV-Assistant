import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStations } from '../context/StationContext';
import { useTelemetry } from '../context/TelemetryContext';
import axios from 'axios';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Cpu, 
  AlertTriangle, 
  Zap, 
  Server, 
  Activity, 
  Users as UsersIcon, 
  ToggleLeft, 
  ToggleRight,
  BookOpen,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Check,
  X,
  Loader
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const { stations, updateSlotStatus } = useStations();
  const { socket } = useTelemetry();

  const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

  // Navigation tab
  const [activeTab, setActiveTab] = useState('grid'); // 'grid', 'users', 'bookings', 'reports'

  // Live real-time socket metrics
  const [liveMetrics, setLiveMetrics] = useState({
    totalDrivers: 1204,
    activeSessions: 0,
    activeLoadKw: 0,
    totalSockets: 0,
    occupancyRate: 0
  });

  // Alerts
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [clearedAlertIds, setClearedAlertIds] = useState([]);

  // User Management lists
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserState, setEditUserState] = useState({
    name: '',
    role: 'driver',
    tier: 'bronze',
    points: 0
  });
  const [userMsg, setUserMsg] = useState({ type: '', text: '' });

  // Booking list
  const [bookingsList, setBookingsList] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Reports state
  const [generatingReport, setGeneratingReport] = useState(false);

  // Fetch initial telemetry state when grid monitor loads
  useEffect(() => {
    if (socket && user?.role === 'admin' && activeTab === 'grid') {
      console.log('🛡️ [Admin Dashboard] Initiating Socket.io telemetry monitoring...');
      socket.emit('admin:subscribe');

      const handleTelemetry = (data) => {
        setLiveMetrics(data.metrics);
        // Filter out cleared alerts
        const active = data.alerts.filter(al => !clearedAlertIds.includes(al.id));
        setLiveAlerts(active);
      };

      socket.on('admin:telemetry', handleTelemetry);

      return () => {
        console.log('🛡️ [Admin Dashboard] Unsubscribing from Socket.io telemetry...');
        socket.emit('admin:unsubscribe');
        socket.off('admin:telemetry', handleTelemetry);
      };
    }
  }, [socket, user, activeTab, clearedAlertIds]);

  // Retrieve user lists
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUsersList(res.data.users);
      }
    } catch (err) {
      console.error('Failed to retrieve system users:', err.message);
      setUserMsg({ type: 'error', text: 'Authorization failed loading users.' });
    } finally {
      setLoadingUsers(false);
    }
  };

  // Retrieve bookings logs
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await axios.get(`${API_URL}/admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setBookingsList(res.data.bookings);
      }
    } catch (err) {
      console.error('Failed to load bookings logs:', err.message);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Grid Stats Calculations (combines context stations & live socket measurements)
  const totalStations = stations.length;
  const totalSlots = stations.reduce((acc, curr) => acc + curr.slots.length, 0);
  const occupiedSlots = stations.reduce((acc, curr) => acc + curr.slots.filter(sl => sl.status === 'occupied').length, 0);
  const localOccupancyRate = Math.round((occupiedSlots / totalSlots) * 100) || 0;
  
  const displayDrivers = liveMetrics.totalDrivers;
  const displayLoad = liveMetrics.activeSessions > 0 ? liveMetrics.activeLoadKw : occupiedSlots * 75;
  const displayOccupancy = liveMetrics.activeSessions > 0 ? liveMetrics.occupancyRate : localOccupancyRate;

  const handleToggleSlotAdmin = (stationId, slotId, currentStatus) => {
    const nextStatus = currentStatus === 'occupied' ? 'available' : 'occupied';
    updateSlotStatus(stationId, slotId, nextStatus);
  };

  const handleClearAlert = (id) => {
    setClearedAlertIds(prev => [...prev, id]);
    setLiveAlerts(prev => prev.filter(al => al.id !== id));
  };

  // Edit user save click handler
  const handleEditUserSave = async (id) => {
    try {
      const res = await axios.put(`${API_URL}/admin/users/${id}`, editUserState, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUsersList(prev => prev.map(u => u._id === id ? { ...u, ...editUserState } : u));
        setEditingUserId(null);
        setUserMsg({ type: 'success', text: 'User details updated successfully.' });
      }
    } catch (err) {
      setUserMsg({ type: 'error', text: err.response?.data?.message || 'Failed to edit user.' });
    }
  };

  // Delete user click handler
  const handleDeleteUser = async (id) => {
    if (confirm('Are you sure you want to remove this driver from the system?')) {
      try {
        const res = await axios.delete(`${API_URL}/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setUsersList(prev => prev.filter(u => u._id !== id));
          setUserMsg({ type: 'success', text: 'Driver deleted successfully.' });
        }
      } catch (err) {
        setUserMsg({ type: 'error', text: err.response?.data?.message || 'Deletion failed.' });
      }
    }
  };

  // Trigger spreadsheet CSV downloads
  const handleDownloadReport = async (reportType) => {
    setGeneratingReport(true);
    try {
      const res = await axios.get(`${API_URL}/admin/reports/${reportType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const { filename, data } = res.data;
        const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      alert('Failed to generate report spreadsheet.');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Enforce admin permission guards
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <ShieldAlert className="w-16 h-16 text-rose-500 animate-bounce" />
        <h3 className="text-xl font-extrabold text-slate-800">Operational Access Denied</h3>
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
          This terminal is protected with administrative privileges. Please authenticate as an admin (e.g. `admin@ev.app`) to access the power grid controls.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none flex items-center gap-2">
            <Server className="w-7 h-7 text-purple-650 animate-pulse" />
            <span>Grid Admin Terminal</span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Supervisory terminal for operational hubs, user directories, and power grids
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50 text-xs font-bold shadow-inner">
          <button
            onClick={() => setActiveTab('grid')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'grid' ? 'bg-white text-purple-650 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Live Monitor
          </button>
          <button
            onClick={() => {
              setActiveTab('users');
              fetchUsers();
            }}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'users' ? 'bg-white text-purple-650 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            User Directory
          </button>
          <button
            onClick={() => {
              setActiveTab('bookings');
              fetchBookings();
            }}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'bookings' ? 'bg-white text-purple-650 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Bookings list
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'reports' ? 'bg-white text-purple-650 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Reports
          </button>
        </div>
      </div>

      {/* 1. TAB: Live Supervisory Monitor */}
      {activeTab === 'grid' && (
        <div className="space-y-6 animate-fade-in">
          {/* Grid Load Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200/50 rounded-2xl flex items-center gap-4 text-left">
              <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                <Server className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase leading-none">Hubs Online</h4>
                <p className="text-xl font-black text-slate-800 mt-1.5">{totalStations} Stations</p>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200/50 rounded-2xl flex items-center gap-4 text-left">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <Zap className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase leading-none">Active load</h4>
                <p className="text-xl font-black text-slate-800 mt-1.5">{displayLoad} kW</p>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200/50 rounded-2xl flex items-center gap-4 text-left">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase leading-none">Grid Occupancy</h4>
                <p className="text-xl font-black text-slate-800 mt-1.5">{displayOccupancy}% Slots</p>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200/50 rounded-2xl flex items-center gap-4 text-left">
              <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
                <UsersIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase leading-none">Connected Sockets</h4>
                <p className="text-xl font-black text-slate-800 mt-1.5">{displayDrivers} Drivers</p>
              </div>
            </div>
          </div>

          {/* Main Monitor Layout split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Side: Overheating/Fault alerts log */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50 text-left space-y-4 bg-white/40">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 leading-none">
                  <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
                  <span>Fault Alert Center</span>
                </h3>

                <div className="space-y-3">
                  {liveAlerts.length === 0 ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
                      <ShieldCheck className="w-5 h-5 text-emerald-500 animate-pulse" />
                      <span>All nodes running at normal tolerances.</span>
                    </div>
                  ) : (
                    liveAlerts.map((al) => (
                      <div
                        key={al.id}
                        className={`p-3.5 border rounded-2xl flex flex-col gap-2 relative ${
                          al.level === 'critical' ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-amber-50 border-amber-100 text-amber-800'
                        }`}
                      >
                        <div>
                          <span className={`text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                            al.level === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {al.level}
                          </span>
                          <h4 className="text-xs font-extrabold mt-1.5">{al.station} — Slot {al.slot}</h4>
                          <p className="text-[10px] font-semibold text-rose-600 mt-1 leading-snug">{al.issue}</p>
                        </div>

                        <button
                          onClick={() => handleClearAlert(al.id)}
                          className="self-end px-3 py-1 bg-white hover:bg-slate-100 text-[10px] font-bold rounded-lg border border-slate-200 transition-colors"
                        >
                          Dismiss Log
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Side: Stations Slot Management grid */}
            <div className="lg:col-span-2 space-y-4">
              <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50 text-left space-y-5 bg-white/40">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 leading-none">
                  <Cpu className="w-5 h-5 text-purple-650" />
                  <span>Grid Node Overrides (Context Sync)</span>
                </h3>

                <div className="space-y-5">
                  {stations.map((st) => (
                    <div key={st._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/30">
                      <h4 className="text-xs font-bold text-slate-800 mb-3">{st.name} ({st.operator})</h4>
                      
                      {/* Slots control grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {st.slots.map((slot) => {
                          const isOccupied = slot.status === 'occupied';
                          return (
                            <div
                              key={slot.id}
                              className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs"
                            >
                              <div>
                                <span className="font-extrabold text-slate-800 block">{slot.id}</span>
                                <span className="text-[9px] text-slate-400 font-bold block uppercase">{slot.power_kW} kW</span>
                              </div>
                              
                              {/* Toggle switches */}
                              <button
                                onClick={() => handleToggleSlotAdmin(st._id, slot.id, slot.status)}
                                className="text-slate-600 hover:opacity-90 transition-opacity"
                                title={`Click to toggle ${slot.id}`}
                              >
                                {isOccupied ? (
                                  <ToggleRight className="w-8 h-8 text-indigo-600" />
                                ) : (
                                  <ToggleLeft className="w-8 h-8 text-slate-350" />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB: User Management Directory */}
      {activeTab === 'users' && (
        <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50 text-left bg-white/40 animate-fade-in space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 leading-none">
              <UsersIcon className="w-5 h-5 text-indigo-500" />
              <span>User Directory Manager</span>
            </h3>
            <button
              onClick={fetchUsers}
              disabled={loadingUsers}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-bold transition-all"
            >
              Refresh Table
            </button>
          </div>

          {/* User Message Banner */}
          {userMsg.text && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
              userMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              <AlertTriangle className="w-4 h-4" />
              <span>{userMsg.text}</span>
            </div>
          )}

          {loadingUsers ? (
            <div className="py-12 flex justify-center items-center gap-2 text-slate-400 font-semibold text-xs">
              <Loader className="w-5 h-5 animate-spin text-indigo-600" />
              <span>Fetching system accounts...</span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/30">
              <table className="w-full text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase text-[9px] font-black text-slate-400 border-b border-slate-200/30">
                  <tr>
                    <th className="px-4 py-3 text-left">Driver Name</th>
                    <th className="px-4 py-3 text-left">Email Address</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Tier</th>
                    <th className="px-4 py-3 text-left">Carbon Points</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {usersList.map((u) => {
                    const isEditing = editingUserId === u._id;
                    return (
                      <tr key={u._id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold text-slate-800">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editUserState.name}
                              onChange={(e) => setEditUserState({ ...editUserState, name: e.target.value })}
                              className="px-2 py-1 border rounded bg-slate-50 text-xs w-28"
                            />
                          ) : (
                            u.name
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-500">{u.email}</td>
                        <td className="px-4 py-3 text-slate-400">{u.phone || 'N/A'}</td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <select
                              value={editUserState.role}
                              onChange={(e) => setEditUserState({ ...editUserState, role: e.target.value })}
                              className="px-1 py-0.5 border rounded bg-slate-50 text-xs"
                            >
                              <option value="driver">driver</option>
                              <option value="station_operator">operator</option>
                              <option value="admin">admin</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                              u.role === 'station_operator' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {u.role}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 capitalize">
                          {isEditing ? (
                            <select
                              value={editUserState.tier}
                              onChange={(e) => setEditUserState({ ...editUserState, tier: e.target.value })}
                              className="px-1 py-0.5 border rounded bg-slate-50 text-xs"
                            >
                              <option value="bronze">bronze</option>
                              <option value="silver">silver</option>
                              <option value="gold">gold</option>
                            </select>
                          ) : (
                            u.tier || 'bronze'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editUserState.points}
                              onChange={(e) => setEditUserState({ ...editUserState, points: Number(e.target.value) })}
                              className="px-2 py-1 border rounded bg-slate-50 text-xs w-16"
                            />
                          ) : (
                            `${u.points || 0} pts`
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleEditUserSave(u._id)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingUserId(null)}
                                  className="p-1 text-slate-400 hover:bg-slate-50 rounded"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingUserId(u._id);
                                    setEditUserState({
                                      name: u.name,
                                      role: u.role,
                                      tier: u.tier || 'bronze',
                                      points: u.points || 0
                                    });
                                  }}
                                  className="p-1 text-slate-500 hover:bg-slate-100 rounded"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u._id)}
                                  className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. TAB: Charging Slot Booking list */}
      {activeTab === 'bookings' && (
        <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50 text-left bg-white/40 animate-fade-in space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 leading-none">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <span>EV Bookings Audit Monitor</span>
            </h3>
            <button
              onClick={fetchBookings}
              disabled={loadingBookings}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-bold transition-all"
            >
              Refresh bookings
            </button>
          </div>

          {loadingBookings ? (
            <div className="py-12 flex justify-center items-center gap-2 text-slate-400 font-semibold text-xs">
              <Loader className="w-5 h-5 animate-spin text-indigo-600" />
              <span>Reading active bookings logs...</span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/30">
              <table className="w-full text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase text-[9px] font-black text-slate-400 border-b border-slate-200/30">
                  <tr>
                    <th className="px-4 py-3 text-left">Booking ID</th>
                    <th className="px-4 py-3 text-left">EV Driver</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Station Hub ID</th>
                    <th className="px-4 py-3 text-left">Slot ID</th>
                    <th className="px-4 py-3 text-left">Scheduled Time</th>
                    <th className="px-4 py-3 text-left">Duration</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {bookingsList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-slate-400 italic">No bookings registered in system.</td>
                    </tr>
                  ) : (
                    bookingsList.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold text-slate-800">{b._id}</td>
                        <td className="px-4 py-3 font-bold text-slate-700">{b.userId?.name || 'Unknown'}</td>
                        <td className="px-4 py-3 font-semibold text-slate-500">{b.userId?.email || 'N/A'}</td>
                        <td className="px-4 py-3 text-slate-500 uppercase">{b.stationId}</td>
                        <td className="px-4 py-3 text-slate-800 uppercase font-black">{b.slotId}</td>
                        <td className="px-4 py-3 font-medium text-slate-400">
                          {b.scheduledTime ? new Date(b.scheduledTime).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 font-semibold">{b.duration_min} mins</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            b.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700 animate-pulse'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB: CSV Reports Generation */}
      {activeTab === 'reports' && (
        <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50 text-left bg-white/40 animate-fade-in space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 leading-none">
            <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
            <span>Operational Reports Terminal</span>
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
            Download generated system analytics reports formatted as CSV spreadsheets immediately for grid telemetry audits, registration catalogs, or payment tracking.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/30 flex flex-col justify-between min-h-[140px]">
              <div>
                <h4 className="text-xs font-extrabold text-slate-800">Drivers & Users Registry</h4>
                <p className="text-[10px] text-slate-400 mt-1">Export names, contacts, roles, tier badges, and carbon points balances.</p>
              </div>
              <button
                onClick={() => handleDownloadReport('users')}
                disabled={generatingReport}
                className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-750 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow"
              >
                Download Users CSV
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/30 flex flex-col justify-between min-h-[140px]">
              <div>
                <h4 className="text-xs font-extrabold text-slate-800">Charging Bookings Log</h4>
                <p className="text-[10px] text-slate-400 mt-1">Export booking slot references, schedules, operators, and statuses.</p>
              </div>
              <button
                onClick={() => handleDownloadReport('bookings')}
                disabled={generatingReport}
                className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-750 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow"
              >
                Download Bookings CSV
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/30 flex flex-col justify-between min-h-[140px]">
              <div>
                <h4 className="text-xs font-extrabold text-slate-800">Power Stations Database</h4>
                <p className="text-[10px] text-slate-400 mt-1">Export charging hubs operators, plug counts, pricing rates, and addresses.</p>
              </div>
              <button
                onClick={() => handleDownloadReport('stations')}
                disabled={generatingReport}
                className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-750 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow"
              >
                Download Stations CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
