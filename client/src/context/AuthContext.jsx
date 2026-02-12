import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import api from "../api/axios";
import { requestNotificationPermission, showNotification } from "../utils/notifications";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastNotificationId = useRef(null);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const response = await api.get("/auth/me");
      setUser(response.data);
    } catch (error) {
      setUser(null);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Poll for new notifications and show browser notifications
  useEffect(() => {
    if (!user) return;

    const checkNotifications = async () => {
      try {
        const response = await api.get("/getNotifications");
        const notifications = response.data;

        if (notifications.length > 0) {
          const latestNotification = notifications[0];

          // If this is a new notification, show browser notification
          if (lastNotificationId.current !== latestNotification.id) {
            lastNotificationId.current = latestNotification.id;
            
            showNotification(
              "New notification!",
              latestNotification.message
            );
          }
        }
      } catch (error) {
        // Silently fail
      }
    };

    // Request notification permission
    requestNotificationPermission();

    // Check immediately
    checkNotifications();

    // Then check every 10 seconds
    const interval = setInterval(checkNotifications, 10000);

    return () => clearInterval(interval);
  }, [user]);

  const login = async (payload) => {
    const response = await api.post("/auth/login", payload);
    localStorage.setItem("token", response.data.token);
    setUser(response.data.user);
    requestNotificationPermission();
  };

  const signup = async (payload) => {
    const response = await api.post("/auth/signup", payload);
    localStorage.setItem("token", response.data.token);
    setUser(response.data.user);
    requestNotificationPermission();
  };

  const logout = async () => {
    await api.post("/auth/logout");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
