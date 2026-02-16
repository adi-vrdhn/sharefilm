import React, { useState } from "react";
import api from "../api/axios";
import "../styles/notificationcard.css";

const NotificationCard = ({ note, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Check if this is a rating notification (has movie data)
  const isRatingNotification = note.movie && note.ratings;

  const handleDelete = async (e) => {
    e.stopPropagation();
    
    try {
      setDeleting(true);
      await api.delete(`/notification/${note.id}`);
      onDelete?.(note.id);
    } catch (error) {
      console.error("Failed to delete notification:", error);
      setDeleting(false);
    }
  };

  return (
    <div className="notice-card">
      {isRatingNotification ? (
        <>
          <div 
            className="notification-content"
            onClick={() => setExpanded(!expanded)}
            style={{ cursor: "pointer" }}
          >
            <div className="notification-header">
              <strong>{note.text || "Friend rated your movie recommendation"}</strong>
              <div className="notification-actions">
                <span className="badge">{note.ratings?.length || 0} Rating{(note.ratings?.length || 0) !== 1 ? "s" : ""}</span>
                <button 
                  className="delete-btn"
                  onClick={handleDelete}
                  disabled={deleting}
                  title="Delete notification"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="helper-text">{note.read ? "Read" : "New"}</div>
          </div>

          {expanded && (
            <div className="notification-details">
              <div className="movie-preview-expanded">
                {note.movie?.poster && (
                  <img 
                    src={note.movie.poster} 
                    alt={note.movie.title} 
                    className="notification-poster"
                  />
                )}
                <div className="movie-details">
                  <h4>{note.movie?.title}</h4>
                  <p className="year">{note.movie?.year}</p>
                </div>
              </div>

              <div className="ratings-list">
                {note.ratings?.map((rating, idx) => (
                  <div key={idx} className="rating-item">
                    <div className="rater-info">
                      {rating.User?.profilePicture ? (
                        <img 
                          src={rating.User.profilePicture} 
                          alt={rating.User?.name}
                          className="rater-picture"
                        />
                      ) : (
                        <div className="rater-picture-placeholder">
                          {rating.User?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="rater-name">{rating.User?.name}</span>
                    </div>
                    <div className="rating-stars">
                      <span className="stars">{parseFloat(rating.rating).toFixed(1)}/5.0</span>
                      {rating.comments && (
                        <p className="rating-comment">{rating.comments}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        // Regular text notification
        <div className="notification-content">
          <div className="notification-header">
            <strong>{note.text}</strong>
            <button 
              className="delete-btn"
              onClick={handleDelete}
              disabled={deleting}
              title="Delete notification"
            >
              ✕
            </button>
          </div>
          <div className="helper-text">{note.read ? "Read" : "New"}</div>
        </div>
      )}
    </div>
  );
};

export default NotificationCard;
