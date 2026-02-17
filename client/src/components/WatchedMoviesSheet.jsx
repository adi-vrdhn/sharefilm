import React, { useState, useEffect } from "react";
import api from "../api/axios";
import "../styles/sheet.css";

const WatchedMoviesSheet = ({ isOpen, onClose, userId, isOwnProfile }) => {
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");

  // Genre mapping (TMDB genre IDs to names)
  const genreMap = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Sci-Fi",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western"
  };

  // Fetch watched movies
  useEffect(() => {
    if (!isOpen) return;

    const fetchWatchedMovies = async () => {
      try {
        setLoading(true);
        const endpoint = isOwnProfile
          ? "/profile/watched-movies"
          : `/profile/user/${userId}/watched-movies`;
        const response = await api.get(endpoint);
        const movies = response.data.movies || [];
        setWatchedMovies(movies);
        setFilteredMovies(movies);
        
        // Extract unique languages
        const uniqueLangs = [...new Set(movies.map(m => m.language).filter(Boolean))];
        setLanguages(uniqueLangs);
        
        // Extract unique genres
        const uniqueGenres = [...new Set(movies.flatMap(m => m.genreIds || []))];
        setGenres(uniqueGenres);
      } catch (error) {
        console.error("Error fetching watched movies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchedMovies();
  }, [isOpen, userId, isOwnProfile]);

  // Live search and filter
  useEffect(() => {
    let filtered = watchedMovies;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((movie) =>
        movie.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by language
    if (selectedLanguage) {
      filtered = filtered.filter((movie) => movie.language === selectedLanguage);
    }

    // Filter by genre
    if (selectedGenre) {
      filtered = filtered.filter((movie) =>
        (movie.genreIds || []).includes(parseInt(selectedGenre))
      );
    }

    setFilteredMovies(filtered);
  }, [searchQuery, selectedLanguage, selectedGenre, watchedMovies]);

  const handleDeleteMovie = async (tmdbId) => {
    if (window.confirm("Remove this movie from your watched list?")) {
      try {
        await api.delete(`/watched-movie/${tmdbId}`);
        setWatchedMovies((prev) => prev.filter((m) => m.tmdbId !== tmdbId));
      } catch (error) {
        console.error("Error deleting movie:", error);
      }
    }
  };

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

        {/* Filters - only show for other users' profiles */}
        {!isOwnProfile && (languages.length > 0 || genres.length > 0) && (
          <div className="sheet-filters">
            {languages.length > 0 && (
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="filter-select"
              >
                <option value="">All Languages</option>
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </option>
                ))}
              </select>
            )}

            {genres.length > 0 && (
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="filter-select"
              >
                <option value="">All Genres</option>
                {genres.map((genreId) => (
                  <option key={genreId} value={genreId}>
                    {genreMap[genreId] || `Genre ${genreId}`}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="sheet-content">
          {loading ? (
            <div className="sheet-loading">Loading movies...</div>
          ) : filteredMovies.length === 0 ? (
            <div className="sheet-empty">
              {searchQuery || selectedLanguage || selectedGenre
                ? "No movies found matching your filters"
                : "No watched movies yet"}
            </div>
          ) : (
            <div className="movies-grid">
              {filteredMovies.map((movie) => (
                <div key={movie.id} className="movie-card-compact">
                  <div className="movie-poster-wrapper">
                    <img
                      src={
                        movie.posterPath
                          ? `https://image.tmdb.org/t/p/w300${movie.posterPath}`
                          : "https://via.placeholder.com/100x150"
                      }
                      alt={movie.title}
                      className="movie-poster-compact"
                    />
                    {isOwnProfile && (
                      <button
                        className="movie-delete-btn"
                        onClick={() => handleDeleteMovie(movie.tmdbId)}
                        title="Remove from watched"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <p className="movie-title-compact">{movie.title}</p>
                  {movie.year && (
                    <p className="movie-year-compact">{movie.year}</p>
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
