import React, { useState, useEffect } from "react";
import api from "../api/axios";
import "../styles/sheet.css";

const WatchedMoviesSheet = ({ isOpen, onClose, userId, isOwnProfile }) => {
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredMovies, setFilteredMovies] = useState([]);

  // Fetch watched movies (both rated and viewed)
  useEffect(() => {
    if (!isOpen) return;

    const fetchWatchedMovies = async () => {
      try {
        setLoading(true);
        const endpoint = isOwnProfile
          ? "/profile/watched-movies"
          : `/profile/user/${userId}/watched-movies`;
        const response = await api.get(endpoint);
        setWatchedMovies(response.data.movies || []);
        setFilteredMovies(response.data.movies || []);
      } catch (error) {
        console.error("Error fetching watched movies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchedMovies();
  }, [isOpen, userId, isOwnProfile]);

  // Live search filter by movie name
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMovies(watchedMovies);
      return;
    }

    const filtered = watchedMovies.filter((movie) =>
      movie.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMovies(filtered);
  }, [searchQuery, watchedMovies]);

  if (!isOpen) return null;

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <div className="sheet-handle"></div>
          <h2>🎬 Watched Movies ({watchedMovies.length})</h2>
          <button className="sheet-close" onClick={onClose}>✕</button>
        </div>

        <div className="sheet-search">
          <input
            type="text"
            placeholder="🔍 Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sheet-search-input"
          />
        </div>

        <div className="sheet-content">
          {loading ? (
            <div className="sheet-loading">Loading movies...</div>
          ) : filteredMovies.length === 0 ? (
            <div className="sheet-empty">
              {searchQuery
                ? "No movies found matching your search"
                : "No watched movies yet"}
            </div>
          ) : (
            <div className="movies-grid">
              {filteredMovies.map((movie) => (
                <div key={movie.id} className="movie-card-compact">
                  <img
                    src={
                      movie.posterPath
                        ? `https://image.tmdb.org/t/p/w300${movie.posterPath}`
                        : "https://via.placeholder.com/100x150"
                    }
                    alt={movie.title}
                    className="movie-poster-compact"
                  />
                  <p className="movie-title-compact">{movie.title}</p>
                  {movie.rating && (
                    <div className="movie-rating-compact">
                      ⭐ {movie.rating}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchedMoviesSheet;
