import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ev_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize Authentication State on load
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('ev_token');
      
      // Instantly purge old mock JWT tokens to prevent backend conflicts
      if (savedToken && savedToken.startsWith('mock_jwt_token')) {
        console.warn('🧹 [AuthContext] Mock JWT token detected. Purging localStorage.');
        logout();
        setLoading(false);
        return;
      }

      if (savedToken) {
        try {
          // Fetch authenticated driver profile
          const res = await api.get('/users/profile');
          setUser(res.data.user);
          setToken(savedToken);
        } catch (err) {
          console.error('❌ [AuthContext] Token validation failed:', err.message);
          logout();
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  // Global event listener to capture 401 Unauthorized signals from Axios
  useEffect(() => {
    const handleUnauthorized = () => {
      console.warn('🚨 [AuthContext] 401 Unauthorized captured. Logging out driver.');
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user: userData } = res.data;
      
      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('ev_token', accessToken);
      localStorage.setItem('ev_user', JSON.stringify(userData));
      
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Invalid email or password';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const register = async (name, email, password, phone, evModel, role) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/register', { name, email, password, phone, evModel, role });
      const { accessToken, user: userData } = res.data;
      
      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('ev_token', accessToken);
      localStorage.setItem('ev_user', JSON.stringify(userData));
      
      setLoading(false);
      return { success: true, message: res.data.message };
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const verifyOtp = async (email, otp) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      const { accessToken, user: userData } = res.data;
      
      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('ev_token', accessToken);
      localStorage.setItem('ev_user', JSON.stringify(userData));
      
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Invalid OTP code. Please verify.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setLoading(false);
      return { success: true, message: res.data.message };
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Email not found in system.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/reset-password', { email, otp, newPassword });
      setLoading(false);
      return { success: true, message: res.data.message };
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Password reset failed.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    // Notify backend of logout if possible
    if (user && token && !token.startsWith('mock_jwt_token')) {
      api.post('/auth/logout', { userId: user.id }).catch(() => {});
    }
    
    setUser(null);
    setToken(null);
    localStorage.removeItem('ev_token');
    localStorage.removeItem('ev_user');
  };

  const updateUserPoints = (pointsToAdd) => {
    if (user) {
      const updatedUser = { ...user, points: (user.points || 0) + pointsToAdd };
      setUser(updatedUser);
      localStorage.setItem('ev_user', JSON.stringify(updatedUser));
    }
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put('/users/profile', profileData);
      const updatedUser = res.data.user;
      setUser(updatedUser);
      localStorage.setItem('ev_user', JSON.stringify(updatedUser));
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Failed to update profile';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put('/users/password', { currentPassword, newPassword });
      setLoading(false);
      return { success: true, message: res.data.message };
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Failed to update password';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const updatePreferences = async (preferencesData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put('/users/preferences', preferencesData);
      const updatedUser = res.data.user;
      setUser(updatedUser);
      localStorage.setItem('ev_user', JSON.stringify(updatedUser));
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Failed to update preferences';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const uploadProfileImage = async (base64Image) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/users/profile-image', { image: base64Image });
      const updatedUser = res.data.user;
      setUser(updatedUser);
      localStorage.setItem('ev_user', JSON.stringify(updatedUser));
      setLoading(false);
      return { success: true, profileImage: res.data.profileImage };
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Failed to upload image';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      error,
      login,
      register,
      verifyOtp,
      logout,
      updateUserPoints,
      forgotPassword,
      resetPassword,
      updateProfile,
      updatePassword,
      updatePreferences,
      uploadProfileImage
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
