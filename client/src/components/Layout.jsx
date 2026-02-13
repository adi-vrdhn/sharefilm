import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/layout.css";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: "/add", label: "Add Movie", icon: "➕" },
    { path: "/discover", label: "Discover", icon: "✨" },
    { path: "/watchlist", label: "Watchlist", icon: "📌" },
    { path: "/party", label: "Movie Party", icon: "🎬" },
    { path: "/list", label: "My Movies", icon: "📽️" },
    { path: "/friends", label: "Friends", icon: "👥" },
    { path: "/chat", label: "Messages", icon: "💬" },
    { path: "/notifications", label: "Notifications", icon: "🔔" }
  ];

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="user-avatar">{user?.name?.[0] || "U"}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Mobile toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>

      {/* Main content */}
      <main className="main-content">
        {children}
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
