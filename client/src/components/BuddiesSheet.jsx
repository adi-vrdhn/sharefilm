import React, { useState, useEffect } from "react";
import api from "../api/axios";
import "../styles/sheet.css";

const BuddiesSheet = ({ isOpen, onClose, userId, isOwnProfile }) => {
  const [buddies, setBuddies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredBuddies, setFilteredBuddies] = useState([]);

  // Fetch buddies (confirmed friends only)
  useEffect(() => {
    if (!isOpen) return;

    const fetchBuddies = async () => {
      try {
        setLoading(true);
        const endpoint = isOwnProfile
          ? "/friends/confirmed"
          : `/friends/confirmed/${userId}`;
        const response = await api.get(endpoint);
        setBuddies(response.data || []);
        setFilteredBuddies(response.data || []);
      } catch (error) {
        console.error("Error fetching buddies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBuddies();
  }, [isOpen, userId, isOwnProfile]);

  // Live search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBuddies(buddies);
      return;
    }

    const filtered = buddies.filter((buddy) =>
      buddy.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredBuddies(filtered);
  }, [searchQuery, buddies]);

  if (!isOpen) return null;

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <div className="sheet-handle"></div>
          <h2>👥 Buddies ({buddies.length})</h2>
          <button className="sheet-close" onClick={onClose}>✕</button>
        </div>

        <div className="sheet-search">
          <input
            type="text"
            placeholder="🔍 Search buddies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sheet-search-input"
          />
        </div>

        <div className="sheet-content">
          {loading ? (
            <div className="sheet-loading">Loading buddies...</div>
          ) : filteredBuddies.length === 0 ? (
            <div className="sheet-empty">
              {searchQuery
                ? "No buddies found matching your search"
                : "No confirmed buddies yet"}
            </div>
          ) : (
            <div className="buddies-list">
              {filteredBuddies.map((buddy) => (
                <div key={buddy.id} className="buddy-item">
                  <img
                    src={buddy.profilePicture || "https://via.placeholder.com/40"}
                    alt={buddy.name}
                    className="buddy-avatar"
                  />
                  <div className="buddy-info">
                    <p className="buddy-name">{buddy.name}</p>
                    <p className="buddy-username">@{buddy.username}</p>
                  </div>
                  <button
                    className="buddy-view-btn"
                    onClick={() => {
                      window.location.href = `/profile/${buddy.id}`;
                    }}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuddiesSheet;
