import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      setUser(null);
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (payload) => {
    const response = await api.post('/auth/login', payload);
    await AsyncStorage.setItem('token', response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const signup = async (payload) => {
    const response = await api.post('/auth/signup', payload);
    await AsyncStorage.setItem('token', response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const googleLogin = async (googleToken) => {
    const response = await api.post('/auth/google-login', { token: googleToken });
    await AsyncStorage.setItem('token', response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, googleLogin, updateUser, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
