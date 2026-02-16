import React, { useState } from "react";
import api from "../api/axios";

const TasteMatchCard = ({ movie, friendId, onRate, isLoading }) => {
  const [submitting, setSubmitting] = useState(false);

  const handleRate = async (rating) => {
    try {
      setSubmitting(true);

      // Send rating to backend with friendId
      await api.post(`/api/taste-match/rate/${friendId}`, {
        tmdb_movie_id: movie.id,
        rating: rating, // 1 for "MY TYPE", -1 for "Nahhh"
        movie_title: movie.title,
        genres: movie.genres || [],
        popularity: movie.popularity || 0
      });

      // Callback to parent to fetch next movie
      if (onRate) {
        onRate();
      }
    } catch (error) {
      console.error("Error rating movie:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!movie) {
    return <div className="taste-match-card loading">Loading movie...</div>;
  }

  return (
    <div className="taste-match-card">
      <div className="taste-card-poster">
        {movie.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w400${movie.poster_path}`}
            alt={movie.title}
          />
        ) : (
          <div className="poster-placeholder">
            <span>No Poster</span>
          </div>
        )}
      </div>

      <div className="taste-card-content">
        <h2>{movie.title}</h2>
        {movie.release_date && (
          <p className="release-year">{new Date(movie.release_date).getFullYear()}</p>
        )}

        {movie.genres && movie.genres.length > 0 && (
          <div className="genres">
            {movie.genres.map((genre) => (
              <span key={genre} className="genre-badge">
                {genre}
              </span>
            ))}
          </div>
        )}

        {movie.overview && (
          <p className="overview">{movie.overview.substring(0, 200)}...</p>
        )}

        <div className="taste-card-actions">
          <button
            className="btn btn-my-type"
            onClick={() => handleRate(1)}
            disabled={submitting || isLoading}
          >
            <span className="btn-icon">✓</span>
            MY TYPE
          </button>
          <button
            className="btn btn-nahhh"
            onClick={() => handleRate(-1)}
            disabled={submitting || isLoading}
          >
            <span className="btn-icon">✗</span>
            Nahhh
          </button>
        </div>
      </div>
    </div>
  );
};

export default TasteMatchCard;
