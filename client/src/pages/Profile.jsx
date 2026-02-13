import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/profile.css";

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState("");
  const [isEditingPicture, setIsEditingPicture] = useState(false);

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

  const handlePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;
        const response = await api.put("/profile/me", { profilePicture: base64 });
        setProfile((prev) => ({ ...prev, profilePicture: response.data.profilePicture }));
        setStatus("Picture updated!");
        setTimeout(() => setStatus(""), 3000);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setStatus("Failed to update picture");
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
              <label className="picture-upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePictureUpload}
                  className="picture-upload-input"
                />
                <span className="upload-button">Change Picture</span>
              </label>
            )}
          </div>

          {/* Profile Info */}
          <div className="profile-info">
            <div className="profile-header-top">
              <h1 className="profile-name">{profile.name}</h1>
              <span className="buddy-count">
                <span className="buddies-icon">👥</span>
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
    </div>
  );
};

export default Profile;
