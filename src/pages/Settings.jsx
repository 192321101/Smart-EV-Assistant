import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useVehicles } from '../context/VehicleContext';
import { 
  Settings as SettingsIcon, 
  User, 
  Trash, 
  Car, 
  PlusCircle, 
  Camera, 
  Lock, 
  Sliders, 
  Check, 
  AlertCircle, 
  Edit3, 
  X,
  Loader
} from 'lucide-react';

export default function Settings() {
  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const { user, updateProfile, updatePassword, updatePreferences, uploadProfileImage, loading: authLoading } = useAuth();
  const { vehicles, activeVehicle, addVehicle, deleteVehicle, updateVehicle, setVehicleDefault, loading: vehicleLoading } = useVehicles();

  // Profile details state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification and Target SoC states
  const [targetCharge, setTargetCharge] = useState(80);
  const [allowPush, setAllowPush] = useState(true);
  const [allowSmsAlert, setAllowSmsAlert] = useState(true);

  // Add Vehicle form state
  const [newVehicle, setNewVehicle] = useState({
    name: '',
    brand: '',
    model: '',
    batteryCapacity_kWh: 40,
    connectorType: 'CCS',
    color: '#0ea5e9',
    plateNumber: '',
    isDefault: false
  });

  // Edit Vehicle inline state
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [editVehicleState, setEditVehicleState] = useState({
    name: '',
    brand: '',
    model: '',
    batteryCapacity_kWh: 40,
    connectorType: 'CCS',
    color: '#0ea5e9',
    plateNumber: ''
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef(null);

  // Toast / Inline Messages
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [prefMsg, setPrefMsg] = useState({ type: '', text: '' });
  const [garageMsg, setGarageMsg] = useState({ type: '', text: '' });

  // Sync state values on load or user data retrieval
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setTargetCharge(user.targetCharge || 80);
      setAllowPush(user.allowPush !== false);
      setAllowSmsAlert(user.allowSmsAlert !== false);
    }
  }, [user]);

  // Timers to clear messages after 5 seconds
  useEffect(() => {
    if (profileMsg.text) {
      const timer = setTimeout(() => setProfileMsg({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [profileMsg]);

  useEffect(() => {
    if (passwordMsg.text) {
      const timer = setTimeout(() => setPasswordMsg({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [passwordMsg]);

  useEffect(() => {
    if (prefMsg.text) {
      const timer = setTimeout(() => setPrefMsg({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [prefMsg]);

  useEffect(() => {
    if (garageMsg.text) {
      const timer = setTimeout(() => setGarageMsg({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [garageMsg]);

  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Convert image upload to base64 and trigger API upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileMsg({ type: 'error', text: 'Format unsupported. Please choose an image file.' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ type: 'error', text: 'File is too large (maximum limit 5MB).' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      setProfileMsg({ type: 'info', text: 'Uploading avatar image...' });
      const res = await uploadProfileImage(base64Data);
      if (res.success) {
        setProfileMsg({ type: 'success', text: 'Profile picture uploaded successfully!' });
      } else {
        setProfileMsg({ type: 'error', text: res.error || 'Failed to upload profile picture.' });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!name || name.trim() === '') {
      setProfileMsg({ type: 'error', text: 'Full Name cannot be empty.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setProfileMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    const res = await updateProfile({ name, email, phone });
    if (res.success) {
      setProfileMsg({ type: 'success', text: 'Profile details saved successfully!' });
    } else {
      setProfileMsg({ type: 'error', text: res.error || 'Failed to update profile details.' });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    const res = await updatePassword(currentPassword, newPassword);
    if (res.success) {
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMsg({ type: 'error', text: res.error || 'Password update failed. Verify old password.' });
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    const res = await updatePreferences({ targetCharge, allowPush, allowSmsAlert });
    if (res.success) {
      setPrefMsg({ type: 'success', text: 'Preferences saved successfully!' });
    } else {
      setPrefMsg({ type: 'error', text: res.error || 'Failed to update preferences.' });
    }
  };

  const handleAddVehicleSubmit = async (e) => {
    e.preventDefault();
    if (!newVehicle.name || !newVehicle.brand || !newVehicle.plateNumber) {
      setGarageMsg({ type: 'error', text: 'Please fill in vehicle nickname, brand, and plate number.' });
      return;
    }

    if (newVehicle.batteryCapacity_kWh <= 0) {
      setGarageMsg({ type: 'error', text: 'Battery capacity must be greater than 0 kWh.' });
      return;
    }

    const res = await addVehicle({
      ...newVehicle,
      batteryCapacity_kWh: Number(newVehicle.batteryCapacity_kWh)
    });

    if (res.success) {
      setGarageMsg({ type: 'success', text: 'New vehicle registered in your garage profile!' });
      setNewVehicle({
        name: '',
        brand: '',
        model: '',
        batteryCapacity_kWh: 40,
        connectorType: 'CCS',
        color: '#0ea5e9',
        plateNumber: '',
        isDefault: false
      });
      setShowAddForm(false);
    } else {
      setGarageMsg({ type: 'error', text: res.error || 'Failed to add vehicle.' });
    }
  };

  const startEditingVehicle = (v) => {
    setEditingVehicleId(v._id);
    setEditVehicleState({
      name: v.name,
      brand: v.brand,
      model: v.model,
      batteryCapacity_kWh: v.batteryCapacity_kWh,
      connectorType: v.connectorType || 'CCS',
      color: v.color || '#0ea5e9',
      plateNumber: v.plateNumber
    });
  };

  const handleUpdateVehicleSubmit = async (e, id) => {
    e.preventDefault();
    if (!editVehicleState.name || !editVehicleState.brand || !editVehicleState.plateNumber) {
      setGarageMsg({ type: 'error', text: 'Please fill in nickname, manufacturer brand, and license plate.' });
      return;
    }

    if (editVehicleState.batteryCapacity_kWh <= 0) {
      setGarageMsg({ type: 'error', text: 'Battery capacity must be greater than 0 kWh.' });
      return;
    }

    const res = await updateVehicle(id, {
      ...editVehicleState,
      batteryCapacity_kWh: Number(editVehicleState.batteryCapacity_kWh)
    });

    if (res.success) {
      setGarageMsg({ type: 'success', text: 'Vehicle specifications updated successfully!' });
      setEditingVehicleId(null);
    } else {
      setGarageMsg({ type: 'error', text: res.error || 'Failed to update vehicle details.' });
    }
  };

  const handleSetDefault = async (id) => {
    const res = await setVehicleDefault(id);
    if (res.success) {
      setGarageMsg({ type: 'success', text: 'Default vehicle updated successfully!' });
    } else {
      setGarageMsg({ type: 'error', text: res.error || 'Failed to change default vehicle.' });
    }
  };

  const handleDeleteVehicleClick = async (id) => {
    if (confirm('Are you sure you want to remove this vehicle from your garage?')) {
      const res = await deleteVehicle(id);
      if (res.success) {
        setGarageMsg({ type: 'success', text: 'Vehicle removed from your garage.' });
      } else {
        setGarageMsg({ type: 'error', text: res.error || 'Failed to remove vehicle.' });
      }
    }
  };

  if (authLoading && !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="text-left">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">Settings</h1>
        <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
          Customize charging targets, user profiles, and active EV garage
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left column: Account & Charging limits */}
        <div className="lg:col-span-2 space-y-6 text-left">
          
          {/* Panel A: Profile settings */}
          <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50 space-y-4 bg-white/40">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 leading-none">
                <User className="w-5 h-5 text-indigo-500" />
                <span>User Profile Details</span>
              </h3>
              {authLoading && <Loader className="w-4 h-4 text-indigo-500 animate-spin" />}
            </div>

            {/* Profile Message Banner */}
            {profileMsg.text && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
                profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                profileMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileMsg.text}</span>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Profile Avatar Upload */}
              <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-500/20 group-hover:border-indigo-500 transition-all shadow-lg flex items-center justify-center bg-slate-100">
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage.startsWith('http') ? user.profileImage : `${BACKEND_URL}${user.profileImage}`} 
                      alt={user.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-indigo-500">{user?.name ? user.name.charAt(0) : 'E'}</span>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*" 
                />
              </div>

              {/* Profile Fields */}
              <form onSubmit={handleProfileSubmit} className="flex-1 w-full space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+919876543210"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow"
                    >
                      Save Profile Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Panel B: Password Update */}
          <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50 space-y-4 bg-white/40">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 leading-none">
              <Lock className="w-5 h-5 text-rose-500" />
              <span>Change Password</span>
            </h3>

            {/* Password Message Banner */}
            {passwordMsg.text && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
                passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full md:w-auto px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all shadow"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>

          {/* Panel C: Charging limits & Alert targets */}
          <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50 space-y-4 bg-white/40">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 leading-none">
              <Sliders className="w-5 h-5 text-purple-500" />
              <span>Charging & Notification Preferences</span>
            </h3>

            {/* Preference Message Banner */}
            {prefMsg.text && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
                prefMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{prefMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePreferencesSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Target Battery Charge Limit: <strong>{targetCharge}%</strong></span>
                  <span className="text-[10px] text-amber-600 font-extrabold uppercase bg-amber-50 px-2 py-0.5 rounded-md">
                    Recommended: 80% for battery health
                  </span>
                </div>
                
                <input
                  type="range"
                  min={50}
                  max={100}
                  value={targetCharge}
                  onChange={(e) => setTargetCharge(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />

                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowPush}
                      onChange={(e) => setAllowPush(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">Enable Mobile push notification alerts</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowSmsAlert}
                      onChange={(e) => setAllowSmsAlert(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">SMS backup telemetry warnings</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full md:w-auto px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow"
                >
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right column: Vehicle Garage management */}
        <div className="space-y-4 text-left">
          <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50 space-y-4 bg-white/70">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 leading-none">
                <Car className="w-5 h-5 text-indigo-500" />
                <span>EV Garage ({vehicles.length})</span>
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setEditingVehicleId(null);
                }}
                className="text-indigo-600 hover:text-indigo-700 transition-colors"
                title="Add vehicle"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Garage Message Banner */}
            {garageMsg.text && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
                garageMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{garageMsg.text}</span>
              </div>
            )}

            {/* Garage vehicle listings */}
            <div className="space-y-3">
              {vehicleLoading && vehicles.length === 0 ? (
                <div className="flex justify-center py-4">
                  <Loader className="w-5 h-5 text-indigo-500 animate-spin" />
                </div>
              ) : (
                vehicles.map((v) => (
                  <div
                    key={v._id}
                    className={`p-3 border rounded-2xl flex flex-col gap-3 transition-all ${
                      v.isDefault ? 'bg-indigo-50/40 border-indigo-200' : 'bg-slate-50/50 border-slate-200/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: v.color || '#0ea5e9' }} />
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-800 leading-none truncate flex items-center gap-1.5">
                            <span>{v.name}</span>
                            {v.isDefault && (
                              <span className="text-[8px] bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Default
                              </span>
                            )}
                          </h4>
                          <span className="text-[9px] font-bold text-slate-400 mt-1 block truncate">
                            {v.brand} {v.model} ({v.plateNumber}) • {v.batteryCapacity_kWh}kWh • {v.connectorType || 'CCS'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            if (editingVehicleId === v._id) {
                              setEditingVehicleId(null);
                            } else {
                              startEditingVehicle(v);
                              setShowAddForm(false);
                            }
                          }}
                          className="p-1 text-slate-500 hover:bg-slate-200/50 rounded-lg transition-colors"
                          title="Edit vehicle"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Set Default Button */}
                        {!v.isDefault && (
                          <button
                            onClick={() => handleSetDefault(v._id)}
                            className="p-1 text-indigo-500 hover:bg-indigo-100/50 rounded-lg transition-colors font-bold"
                            title="Set Default"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Button */}
                        {vehicles.length > 1 && (
                          <button
                            onClick={() => handleDeleteVehicleClick(v._id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove vehicle"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Vehicle Edit Form */}
                    {editingVehicleId === v._id && (
                      <form onSubmit={(e) => handleUpdateVehicleSubmit(e, v._id)} className="pt-3 border-t border-slate-200/50 space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">EV Name</label>
                            <input
                              type="text"
                              required
                              value={editVehicleState.name}
                              onChange={(e) => setEditVehicleState({ ...editVehicleState, name: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Plate Number</label>
                            <input
                              type="text"
                              required
                              value={editVehicleState.plateNumber}
                              onChange={(e) => setEditVehicleState({ ...editVehicleState, plateNumber: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Brand</label>
                            <input
                              type="text"
                              required
                              value={editVehicleState.brand}
                              onChange={(e) => setEditVehicleState({ ...editVehicleState, brand: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Model</label>
                            <input
                              type="text"
                              value={editVehicleState.model}
                              onChange={(e) => setEditVehicleState({ ...editVehicleState, model: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Capacity (kWh)</label>
                            <input
                              type="number"
                              required
                              value={editVehicleState.batteryCapacity_kWh}
                              onChange={(e) => setEditVehicleState({ ...editVehicleState, batteryCapacity_kWh: Number(e.target.value) })}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Connector</label>
                            <select
                              value={editVehicleState.connectorType}
                              onChange={(e) => setEditVehicleState({ ...editVehicleState, connectorType: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white"
                            >
                              <option value="CCS">DC Fast (CCS)</option>
                              <option value="Type 2">AC (Type 2)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-2 items-center justify-between pt-1">
                          <div className="flex items-center gap-1.5">
                            <label className="text-[8px] font-bold text-slate-400 uppercase">Color</label>
                            <input
                              type="color"
                              value={editVehicleState.color}
                              onChange={(e) => setEditVehicleState({ ...editVehicleState, color: e.target.value })}
                              className="w-8 h-5 p-0 border border-slate-200 rounded cursor-pointer"
                            />
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingVehicleId(null)}
                              className="px-2 py-1 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                            >
                              Save Spec
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add vehicle form panel overlay (nested) */}
            {showAddForm && (
              <form onSubmit={handleAddVehicleSubmit} className="pt-4 border-t border-slate-200/50 space-y-3 animate-fade-in text-xs">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Register EV Profile</h4>
                  <button type="button" onClick={() => setShowAddForm(false)}>
                    <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                  </button>
                </div>
                
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">EV Name (Nickname)</label>
                  <input
                    type="text"
                    required
                    value={newVehicle.name}
                    onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                    placeholder="My ZS EV"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Manufacturer Brand</label>
                    <input
                      type="text"
                      required
                      value={newVehicle.brand}
                      onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                      placeholder="MG"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Model name</label>
                    <input
                      type="text"
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                      placeholder="ZS EV Max"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Capacity (kWh)</label>
                    <input
                      type="number"
                      required
                      value={newVehicle.batteryCapacity_kWh}
                      onChange={(e) => setNewVehicle({ ...newVehicle, batteryCapacity_kWh: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">License Plate Number</label>
                    <input
                      type="text"
                      required
                      value={newVehicle.plateNumber}
                      onChange={(e) => setNewVehicle({ ...newVehicle, plateNumber: e.target.value })}
                      placeholder="DL3CAJ5678"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Connector Type</label>
                    <select
                      value={newVehicle.connectorType}
                      onChange={(e) => setNewVehicle({ ...newVehicle, connectorType: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="CCS">DC Fast (CCS)</option>
                      <option value="Type 2">AC (Type 2)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Theme color</label>
                    <input
                      type="color"
                      value={newVehicle.color}
                      onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                      className="w-full h-8 p-0.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={vehicleLoading}
                  className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow"
                >
                  Save vehicle profile
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
