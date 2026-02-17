import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import ImageEditor from "../components/ImageEditor";
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
  const [isEditingPicture, setIsEditingPicture] = useState(false);
  const [showBuddies, setShowBuddies] = useState(false);
  const [buddies, setBuddies] = useState([]);
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

  const handlePictureSave = async (base64Image) => {
    try {
      const response = await api.put("/profile/me", { profilePicture: base64Image });
      setProfile((prev) => ({ ...prev, profilePicture: response.data.profilePicture }));
      updateProfilePicture(response.data.profilePicture);
      setIsEditingPicture(false);
      setStatus("Picture updated!");
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus("Failed to update picture");
    }
  };

  const loadBuddies = async () => {
    try {
      const response = await api.get("/profile/me/buddies");
      setBuddies(response.data);
      setShowBuddies(true);
    } catch (error) {
      setStatus("Failed to load buddies");
    }
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
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt={profile.name} className="profile-picture" />
              ) : (
                <div className="profile-picture-placeholder">{profile.name.charAt(0).toUpperCase()}</div>
              )}
            </div>
            {isOwnProfile && (
              <div className="profile-actions-vertical">
                <button
                  className="secondary"
                  onClick={() => setIsEditingPicture(true)}
                >
                  📸 Change Picture
                </button>
              </div>
            )}
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

        {/* Buddies Section - Expandable */}
        {isOwnProfile && (
          <div className="buddies-section">
            <button
              className="buddies-header"
              onClick={loadBuddies}
            >
              <span className="buddies-icon">👥</span>
              My Buddies ({profile.buddyCount || 0})
              <span className={`expand-icon ${showBuddies ? "expanded" : ""}`}>▼</span>
            </button>
            {showBuddies && (
              <div className="buddies-list">
                {buddies.length > 0 ? (
                  buddies.map((buddy) => (
                    <div
                      key={buddy.id}
                      className="buddy-item"
                      onClick={() => navigate(`/profile/${buddy.id}`)}
                    >
                      {buddy.profilePicture ? (
                        <img src={buddy.profilePicture} alt={buddy.name} className="buddy-picture" />
                      ) : (
                        <div className="buddy-picture-placeholder">
                          {buddy.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="buddy-name">{buddy.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="no-buddies">No buddies yet</p>
                )}
              </div>
            )}
          </div>
        )}

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

      {/* Image Editor Modal */}
      {isEditingPicture && (
        <ImageEditor
          currentImage={profile?.profilePicture}
          onSave={handlePictureSave}
          onCancel={() => setIsEditingPicture(false)}
        />
      )}

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

    </div>
  );
};

export default Profile;
