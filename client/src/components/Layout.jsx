import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import "../styles/layout.css";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // Check if running as PWA or in browser
  const isInPWA = window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;

  // Admin emails - only these users can see Analytics
  const ADMIN_EMAILS = ["avrdhn28@gmail.com"];
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: "/add", label: "Add Movie", icon: "" },
    { path: "/list", label: "Movie List", icon: "" },
    { path: "/discover", label: "Discover", icon: "" },
    { path: "/games", label: "Games", icon: "" },
    { path: "/party", label: "Movie Party", icon: "" },
    { path: "/friends", label: "Friends", icon: "" },
    { path: "/notifications", label: "Notifications", icon: "" },
    { path: "/analytics", label: "Analytics", icon: "" }
  ];

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">

          <Link to="/profile" className="user-profile-link" onClick={() => setSidebarOpen(false)}>
            <div className="user-avatar">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user?.name} className="user-avatar-img" />
              ) : (
                <span className="user-avatar-text">{user?.name?.[0] || "U"}</span>
              )}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            // Hide Analytics from non-admin users
            if (item.path === "/analytics" && !isAdmin) {
              return null;
            }
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {!isInPWA && (
            <button className="download-app-btn" onClick={() => setShowDownloadModal(true)}>
              📥 Download the App
            </button>
          )}
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
        <div className="page-header-title">FILMSHARE</div>
        {children}
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Download App Modal */}
      {showDownloadModal && (
        <div className="modal-overlay" onClick={() => setShowDownloadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add FilmShare to Your Home Screen</h3>
            </div>
            <div className="modal-body">
              <p>To access FilmShare like a native app:</p>
              <ol style={{ paddingLeft: "20px", lineHeight: "1.8" }}>
                <li><strong>Open this page in your browser</strong></li>
                <li><strong>Tap the share button</strong> (usually at the top or bottom)</li>
                <li><strong>Select "Add to Home Screen"</strong></li>
                <li>Confirm and enjoy FilmShare as an app!</li>
              </ol>
              <p style={{ marginTop: "16px", fontSize: "12px", opacity: 0.7 }}>
                This works on most mobile browsers including Chrome, Safari, and Firefox.
              </p>
            </div>
            <div className="modal-footer">
              <button className="primary" onClick={() => setShowDownloadModal(false)}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
