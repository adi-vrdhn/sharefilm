import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import BuddiesSheet from "../components/BuddiesSheet";
import WatchedMoviesSheet from "../components/WatchedMoviesSheet";
import WhatToWatchNext from "../components/WhatToWatchNext";
import "../styles/profile.css";

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: authUser, updateUsername, updateProfilePicture } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState("");
  const [showBuddiesSheet, setShowBuddiesSheet] = useState(false);
  const [showWatchedMoviesSheet, setShowWatchedMoviesSheet] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [showMoviesTo, setShowMoviesTo] = useState(false);
  const [moviesTo, setMoviesTo] = useState([]);
  const [showMoviesFrom, setShowMoviesFrom] = useState(false);
  const [moviesFrom, setMoviesFrom] = useState([]);


  const isOwnProfile = !userId;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const endpoint = isOwnProfile ? "/profile/me" : `/profile/user/${userId}`;
        const response = await api.get(endpoint);
        setProfile(response.data);
        setTempBio(response.data.bio || "");
      } catch (error) {
        setStatus("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [userId, isOwnProfile]);

  const handleBioSave = async () => {
    try {
      const response = await api.put("/profile/me", { bio: tempBio });
      setProfile((prev) => ({ ...prev, bio: response.data.bio }));
      setIsEditingBio(false);
      setStatus("Bio updated!");
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus("Failed to update bio");
    }
  };

const handleOpenBuddiesSheet = () => {
    setShowBuddiesSheet(true);
  };

  const loadMoviesTo = async () => {
    try {
      const endpoint = isOwnProfile ? `/profile/user/${authUser.id}/movies-to` : `/profile/user/${userId}/movies-to`;
      const response = await api.get(endpoint);
      setMoviesTo(response.data);
      setShowMoviesTo(true);
    } catch (error) {
      setStatus("Failed to load recommendations");
    }
  };

  const loadMoviesFrom = async () => {
    try {
      const endpoint = isOwnProfile ? `/profile/user/${authUser.id}/movies-from` : `/profile/user/${userId}/movies-from`;
      const response = await api.get(endpoint);
      setMoviesFrom(response.data);
      setShowMoviesFrom(true);
    } catch (error) {
      setStatus("Failed to load recommendations");
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setStatus("All fields required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("New passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      setStatus("New password must be at least 6 characters");
      return;
    }

    try {
      await api.put("/profile/change-password", {
        currentPassword,
        newPassword
      });
      setStatus("Password changed successfully!");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to change password");
    }
  };

  const handleUsernameChange = async () => {
    if (!newUsername) {
      setStatus("Username required");
      return;
    }
    if (newUsername.length < 3) {
      setStatus("Username must be at least 3 characters");
      return;
    }

    try {
      await api.put("/profile/change-username", {
        newUsername
      });
      setProfile((prev) => ({ ...prev, name: newUsername }));
      updateUsername(newUsername);
      setStatus("Username changed successfully!");
      setShowUsernameModal(false);
      setNewUsername("");
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to change username");
    }
  };

  if (loading) {
    return <div className="container"><p className="helper-text">Loading profile...</p></div>;
  }

  if (!profile) {
    return <div className="container"><p className="helper-text error">Profile not found</p></div>;
  }

  return (
    <div className="container">
      <div className="profile-card">
        <div className="profile-header">
          {/* Profile Picture */}
          <div className="profile-picture-section">
            <div className="profile-picture-container">
              <div className="profile-picture-placeholder">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            </div>


          </div>

          {/* Profile Info */}
          <div className="profile-info">
            <div className="profile-header-top">
              <h1 className="profile-name">{profile.name}</h1>
              <span className="buddy-count">
                <span className="buddies-icon"></span>
                {profile.buddyCount || 0} Buddies
              </span>
            </div>

            {/* Bio Section */}
            <div className="bio-section">
              {isEditingBio ? (
                <div className="bio-edit">
                  <textarea
                    value={tempBio}
                    onChange={(e) => setTempBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    maxLength={160}
                    className="bio-textarea"
                  />
                  <div className="bio-edit-actions">
                    <button className="primary" onClick={handleBioSave}>
                      Save Bio
                    </button>
                    <button
                      className="secondary"
                      onClick={() => {
                        setIsEditingBio(false);
                        setTempBio(profile.bio || "");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="char-count">{tempBio.length}/160</p>
                </div>
              ) : (
                <div className="bio-view">
                  <p className="bio-text">{profile.bio || "No bio yet"}</p>
                  {isOwnProfile && (
                    <button
                      className="secondary"
                      onClick={() => setIsEditingBio(true)}
                      style={{ marginTop: "10px" }}
                    >
                      Edit Bio
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buddies Section - Sheet Button */}
        <div className="buddies-section">
          <button
            className="section-button buddies-button"
            onClick={handleOpenBuddiesSheet}
          >
            <span className="button-emoji">👥</span>
            <span className="button-text">Buddies</span>
            <span className="button-badge">{profile.buddyCount || 0}</span>
          </button>
        </div>

        {/* Watched Movies Section - Sheet Button */}
        <div className="watched-movies-section">
          <button
            className="section-button watched-movies-button"
            onClick={() => setShowWatchedMoviesSheet(true)}
          >
            <span className="button-emoji">🎬</span>
            <span className="button-text">Watched Movies</span>
            <span className="button-badge">0</span>
          </button>
        </div>

        {/* Movies Recommended To This User */}
        <div className="recommendations-section">
          <button
            className="recommendations-header"
            onClick={loadMoviesTo}
          >
            <span className="recommendations-icon"></span>
            Movies Recommended To {isOwnProfile ? "Me" : profile?.name} ({moviesTo.length || 0})
            <span className={`expand-icon ${showMoviesTo ? "expanded" : ""}`}>▼</span>
          </button>
          {showMoviesTo && (
            <div className="recommendations-list">
              {moviesTo.length > 0 ? (
                <div className="recommendations-table">
                  {moviesTo.map((item) => (
                    <div key={item.id} className="table-row">
                      <div className="table-cell movie-name">
                        {item.Movie?.title || "Unknown Movie"}
                      </div>
                      <div className="table-cell date-added">
                        {item.dateAdded ? new Date(item.dateAdded).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-recommendations">No recommendations yet</p>
              )}
            </div>
          )}
        </div>

        {/* Movies Recommended By This User */}
        <div className="recommendations-section">
          <button
            className="recommendations-header"
            onClick={loadMoviesFrom}
          >
            <span className="recommendations-icon">🎬</span>
            Movies {isOwnProfile ? "I've" : `${profile?.name} has`} Recommended ({moviesFrom.length || 0})
            <span className={`expand-icon ${showMoviesFrom ? "expanded" : ""}`}>▼</span>
          </button>
          {showMoviesFrom && (
            <div className="recommendations-list">
              {moviesFrom.length > 0 ? (
                <div className="recommendations-table">
                  {moviesFrom.map((item) => (
                    <div key={item.id} className="table-row">
                      <div className="table-cell movie-name">
                        {item.Movie?.title || "Unknown Movie"}
                      </div>
                      <div className="table-cell date-added">
                        {item.dateAdded ? new Date(item.dateAdded).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-recommendations">No recommendations yet</p>
              )}
            </div>
          )}
        </div>

        {/* What to Watch Next - Personalized Recommendations */}
        {isOwnProfile && <WhatToWatchNext />}

        {/* Account Settings - Own Profile Only */}
        {isOwnProfile && (
          <div className="account-settings-section">
            <h3>Account Settings</h3>
            <div className="settings-buttons">
              <button
                className="secondary"
                onClick={() => setShowPasswordModal(true)}
              >
                Change Password
              </button>
              <button
                className="secondary"
                onClick={() => setShowUsernameModal(true)}
              >
                ✏️ Change Username
              </button>
            </div>
          </div>
        )}

        {/* Status Message */}
        {status && <p className={`helper-text ${status.includes("Failed") ? "error" : "success"}`}>{status}</p>}

        {/* Additional Info */}
        {!isOwnProfile && (
          <div className="profile-actions">
            <button
              className="primary"
              onClick={() => navigate("/friends")}
            >
              View Buddies
            </button>
          </div>
        )}
      </div>



      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content password-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Change Password</h2>
            <div className="modal-form">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="form-input"
                />
              </div>
              {status && (
                <p className={`form-status ${status.includes("Failed") ? "error" : "success"}`}>
                  {status}
                </p>
              )}
              <div className="modal-actions">
                <button className="primary" onClick={handlePasswordChange}>
                  Change Password
                </button>
                <button className="secondary" onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Username Change Modal */}
      {showUsernameModal && (
        <div className="modal-overlay" onClick={() => setShowUsernameModal(false)}>
          <div className="modal-content username-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Change Username</h2>
            <div className="modal-form">
              <div className="form-group">
                <label>New Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter new username (minimum 3 characters)"
                  className="form-input"
                />
              </div>
              {newUsername && newUsername.length < 3 && (
                <p className="form-status error">Username must be at least 3 characters</p>
              )}
              {status && (
                <p className={`form-status ${status.includes("Failed") ? "error" : "success"}`}>
                  {status}
                </p>
              )}
              <div className="modal-actions">
                <button 
                  className="primary" 
                  onClick={handleUsernameChange}
                  disabled={!newUsername || newUsername.length < 3}
                >
                  Change Username
                </button>
                <button className="secondary" onClick={() => {
                  setShowUsernameModal(false);
                  setNewUsername("");
                }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

{/* Buddies Sheet */}
      <BuddiesSheet
        isOpen={showBuddiesSheet}
        onClose={() => setShowBuddiesSheet(false)}
        userId={userId}
        isOwnProfile={isOwnProfile}
      />

      {/* Watched Movies Sheet */}
      <WatchedMoviesSheet
        isOpen={showWatchedMoviesSheet}
        onClose={() => setShowWatchedMoviesSheet(false)}
        userId={userId}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
};

export default Profile;
