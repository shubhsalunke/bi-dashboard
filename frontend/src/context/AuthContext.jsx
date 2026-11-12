import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api';
import {
  getAccessToken,
  setAuthTokens,
  clearAuthTokens,
} from '../utils/authStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getAccessToken());
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getAccessToken();
      if (storedToken) {
        try {
          const profile = await authApi.getCurrentUser();
          setUser(profile);
          setSessionExpired(false);
        } catch (err) {
          console.warn('[AuthContext] Session expired or invalid:', err.message);
          clearAuthTokens();
          setToken(null);
          setUser(null);
          setSessionExpired(true);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async ({ email, password, rememberMe = false }) => {
    const payload = rememberMe ? { email, password, rememberMe: true } : { email, password };
    const data = await authApi.login(payload);
    setAuthTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      rememberMe: Boolean(rememberMe),
    });
    setToken(data.accessToken);
    setUser(data.user);
    setSessionExpired(false);
    return data.user;
  };

  const logout = () => {
    clearAuthTokens();
    setToken(null);
    setUser(null);
    setSessionExpired(false);
  };

  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const value = {
    user,
    token,
    loading,
    sessionExpired,
    clearSessionExpired,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isAnalyst: user?.role === 'analyst',
    canManage: user?.role === 'admin' || user?.role === 'manager',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
