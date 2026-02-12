import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const login = async (payload) => {
    const response = await api.post("/auth/login", payload);
    localStorage.setItem("token", response.data.token);
    setUser(response.data.user);
  };

  const signup = async (payload) => {
    const response = await api.post("/auth/signup", payload);
    localStorage.setItem("token", response.data.token);
    setUser(response.data.user);
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
