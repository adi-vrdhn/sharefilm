import React, { useState } from "react";
import api from "../api/axios";

const MovieCard = ({ item, onDelete, onWatched }) => {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  const handleRateSubmit = async () => {
    try {
      setSubmitting(true);
      await api.post("/rateMovie", {
        userMovieId: item.id,
        rating: parseFloat(rating),
        comments: comments.trim() || null
      });
      setStatus("Rating submitted!");
      setShowRatingModal(false);
      setRating(0);
      setComments("");
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="movie-card">
        {item.movie.poster ? (
          <img src={item.movie.poster} alt={item.movie.title} />
        ) : (
          <div className="poster-placeholder" />
        )}
        <div className="movie-card-body">
          <h3>{item.movie.title}</h3>
          <span className="badge">Added by {item.sender?.name}</span>
          <span className="helper-text">
            {new Date(item.dateAdded).toLocaleDateString()}
          </span>
          <div className="movie-card-actions">
            <div className="action-row">
              {onWatched && (
                <button className="primary" onClick={() => onWatched(item)}>
                  Watched
                </button>
              )}
              {onDelete && (
                <button className="secondary" onClick={() => onDelete(item.id)}>
                  Delete
                </button>
              )}
            </div>
            {onWatched && (
              <button 
                className="primary full-width"
                onClick={() => setShowRatingModal(true)}
              >
                Rate It
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="modal-overlay" onClick={() => !submitting && setShowRatingModal(false)}>
          <div className="modal-content rating-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Rate This Movie</h2>
            <div className="rating-section">
              <div className="movie-preview">
                {item.movie.poster && (
                  <img src={item.movie.poster} alt={item.movie.title} className="modal-poster" />
                )}
                <div className="movie-info">
                  <h3>{item.movie.title}</h3>
                  <p className="year">{item.movie.year}</p>
                </div>
              </div>

              <div className="slider-group">
                <label>Your Rating (0 - 5)</label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={rating * 10}
                    onChange={(e) => setRating(parseFloat(e.target.value) / 10)}
                    className="rating-slider"
                  />
                  <div className="rating-display">{rating.toFixed(1)} / 5.0</div>
                </div>
                <div className="slider-marks">
                  <span>0</span>
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>

              <div className="comments-group">
                <label>Comments (Optional)</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Share your thoughts about this movie..."
                  className="comments-input"
                  maxLength="500"
                  rows="4"
                />
                <span className="char-count">{comments.length}/500</span>
              </div>

              {status && (
                <p className={`form-status ${status.includes("Failed") ? "error" : "success"}`}>
                  {status}
                </p>
              )}

              <div className="modal-actions">
                <button
                  className="primary"
                  onClick={handleRateSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Rating"}
                </button>
                <button
                  className="secondary"
                  onClick={() => setShowRatingModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MovieCard;
