import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/analytics.css";

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("overview"); // 'overview' or 'users'
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${import.meta.env.VITE_API}/analytics/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching stats:", error);
      if (error.response?.status === 403) {
        setAccessDenied(true);
      }
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <h1>📊 App Analytics</h1>
        <p className="loading-text">Loading statistics...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="analytics-page">
        <div className="access-denied">
          <div className="access-denied-icon">🔒</div>
          <h1>Access Denied</h1>
          <p>You do not have permission to view this page.</p>
          <p className="access-hint">Only administrators can access analytics.</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="analytics-page">
        <h1>📊 App Analytics</h1>
        <p className="error-text">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1>📊 App Analytics</h1>
        <div className="view-toggle">
          <button
            className={view === "overview" ? "active" : ""}
            onClick={() => setView("overview")}
          >
            Overview
          </button>
          <button
            className={view === "users" ? "active" : ""}
            onClick={() => setView("users")}
          >
            All Users
          </button>
        </div>
      </div>

      {view === "overview" ? (
        <>
          <div className="stats-grid">
            <div className="stat-box highlight">
              <div className="stat-icon">👥</div>
              <div className="stat-value">{stats.overview.totalUsers}</div>
              <div className="stat-label">Total Users</div>
            </div>

            <div className="stat-box">
              <div className="stat-icon">🆕</div>
              <div className="stat-value">{stats.overview.usersToday}</div>
              <div className="stat-label">New Today</div>
            </div>

            <div className="stat-box">
              <div className="stat-icon">📅</div>
              <div className="stat-value">{stats.overview.usersThisWeek}</div>
              <div className="stat-label">This Week</div>
            </div>

            <div className="stat-box">
              <div className="stat-icon">🎬</div>
              <div className="stat-value">{stats.overview.totalMoviesShared}</div>
              <div className="stat-label">Movies Shared</div>
            </div>

            <div className="stat-box">
              <div className="stat-icon">⚡</div>
              <div className="stat-value">{stats.overview.totalInteractions}</div>
              <div className="stat-label">Total Swipes</div>
            </div>

            <div className="stat-box">
              <div className="stat-icon">🤝</div>
              <div className="stat-value">{Math.floor(stats.overview.totalFriendships)}</div>
              <div className="stat-label">Friendships</div>
            </div>
          </div>

          <div className="analytics-section">
            <h2>🆕 Recent Users</h2>
            <div className="users-table">
              <div className="table-header">
                <div className="table-cell">Name</div>
                <div className="table-cell">Email</div>
                <div className="table-cell">Joined</div>
              </div>
              {stats.recentUsers.map((user) => (
                <div key={user.id} className="table-row">
                  <div className="table-cell"><strong>{user.name}</strong></div>
                  <div className="table-cell">{user.email}</div>
                  <div className="table-cell">{formatDate(user.createdAt)}</div>
                </div>
              ))}
            </div>
          </div>

          {stats.activeUsers && stats.activeUsers.length > 0 && (
            <div className="analytics-section">
              <h2>🔥 Most Active Users</h2>
              <div className="active-users-list">
                {stats.activeUsers.map((item, index) => (
                  <div key={item.userId} className="active-user-item">
                    <div className="rank">#{index + 1}</div>
                    <div className="user-details">
                      <div className="user-name">{item.User?.name || "Unknown"}</div>
                      <div className="activity-count">{item.activityCount} swipes</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="analytics-section">
          <h2>All Users ({stats.recentUsers.length})</h2>
          <div className="users-table">
            <div className="table-header">
              <div className="table-cell">Name</div>
              <div className="table-cell">Email</div>
              <div className="table-cell">Joined</div>
            </div>
            {stats.recentUsers.map((user) => (
              <div key={user.id} className="table-row">
                <div className="table-cell"><strong>{user.name}</strong></div>
                <div className="table-cell">{user.email}</div>
                <div className="table-cell">{formatDate(user.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
