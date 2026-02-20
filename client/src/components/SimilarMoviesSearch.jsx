import React, { useState, useEffect } from "react";
import { Search, ArrowLeft, Heart, X } from "lucide-react";
import api from "../api/axios";
import "../styles/similarMovies.css";

const SimilarMoviesSearch = ({ baseMovie, onBack }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(baseMovie);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Search movies
  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await api.get("/api/tmdb/search", {
        params: { query },
      });
      setSearchResults(response.data.data.results || []);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Fetch similar movies
  const fetchSimilar = async (movieId) => {
    try {
      setLoading(true);
      const response = await api.get("/api/next-show/similar-movies", {
        params: { movieId, limit: 30 },
      });
      setSimilarMovies(response.data.data.similarMovies || []);
    } catch (err) {
      console.error("Error fetching similar movies:", err);
      setSimilarMovies([]);
    } finally {
      setLoading(false);
    }
  };

  // When selected movie changes, fetch similar
  useEffect(() => {
    if (selectedMovie?.id) {
      fetchSimilar(selectedMovie.id);
    }
  }, [selectedMovie]);

  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie);
    setSearchQuery("");
    setSearchResults([]);
  };

  const selectedPoster = selectedMovie?.poster_path
    ? `https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`
    : "https://via.placeholder.com/150x225?text=No+Poster";

  return (
    <div className="similar-movies-container">
      {/* Header */}
      <div className="similar-header">
        <button className="back-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={24} />
        </button>
        <h1>Find Similar Movies</h1>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search for a movie..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="search-input"
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.slice(0, 10).map((movie) => (
              <button
                key={movie.id}
                className="search-result-item"
                onClick={() => handleSelectMovie(movie)}
              >
                {movie.poster_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                    alt={movie.title}
                    className="result-poster"
                  />
                )}
                <div className="result-info">
                  <p className="result-title">{movie.title}</p>
                  <span className="result-year">
                    {movie.release_date ? movie.release_date.split("-")[0] : "N/A"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedMovie && (
        <>
          {/* Selected Movie Card */}
          <div className="selected-movie-card">
            <img
              src={selectedPoster}
              alt={selectedMovie.title}
              className="selected-poster"
            />
            <div className="selected-info">
              <h2>{selectedMovie.title}</h2>
              <p className="selected-year">
                {selectedMovie.release_date ? selectedMovie.release_date.split("-")[0] : "N/A"}
              </p>
              {selectedMovie.vote_average && (
                <div className="selected-rating">
                  ⭐ {selectedMovie.vote_average.toFixed(1)}/10
                </div>
              )}
              <p className="selected-overview">{selectedMovie.overview}</p>
            </div>
          </div>

          {/* Similar Movies Grid */}
          <div className="similar-section">
            <h2>Movies Like This</h2>
            {loading ? (
              <div className="loading">Loading similar movies...</div>
            ) : similarMovies.length > 0 ? (
              <div className="similar-grid">
                {similarMovies.map((movie) => (
                  <div key={movie.id} className="similar-movie-card">
                    {movie.poster_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.title}
                        className="similar-poster"
                      />
                    )}
                    <div className="similarity-score">
                      {(movie.similarityScore * 100).toFixed(0)}%
                    </div>
                    <div className="similar-info">
                      <h3>{movie.title}</h3>
                      <p className="similarity-reason">
                        {movie.similarityReason || "Similar match"}
                      </p>
                      <div className="similar-actions">
                        <button
                          className="action-btn heart-btn"
                          title="Add to Watchlist"
                        >
                          <Heart size={16} />
                        </button>
                        <button
                          className="action-btn pass-btn"
                          title="Not interested"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-similar">No similar movies found</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SimilarMoviesSearch;
