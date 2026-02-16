import React, { useState } from "react";
import "../styles/notificationcard.css";

const NotificationCard = ({ note }) => {
  const [expanded, setExpanded] = useState(false);

  // Check if this is a rating notification (has movie data)
  const isRatingNotification = note.movie && note.ratings;

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
              <span className="badge">{note.ratings?.length || 0} Rating{(note.ratings?.length || 0) !== 1 ? "s" : ""}</span>
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
          <strong>{note.text}</strong>
          <div className="helper-text">{note.read ? "Read" : "New"}</div>
        </div>
      )}
    </div>
  );
};

export default NotificationCard;
