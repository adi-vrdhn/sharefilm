import React, { useState, useEffect } from "react";
import api from "../api/axios";
import "../styles/sheet.css";

// Placeholder image as data URI (SVG)
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='92' height='138' viewBox='0 0 92 138'%3E%3Crect width='92' height='138' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' font-size='12' font-family='sans-serif' fill='%2394a3b8' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

const WatchedMoviesSheet = ({ isOpen, onClose, userId, isOwnProfile }) => {
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");

  // Add movie modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchMovieQuery, setSearchMovieQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchTimeoutRef = React.useRef(null);

  // Drag and drop state
  const [draggingMovie, setDraggingMovie] = useState(null);

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

  // Cleanup timeout on unmount or modal close
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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
        
        // Sort: pinned first by pinOrder, then by date
        const sortedMovies = movies.sort((a, b) => {
          if (a.isPinned && b.isPinned) {
            // Both pinned - sort by pinOrder
            return (a.pinOrder ?? 999) - (b.pinOrder ?? 999);
          }
          if (a.isPinned !== b.isPinned) {
            return b.isPinned ? 1 : -1;
          }
          return new Date(b.watchedAt) - new Date(a.watchedAt);
        });
        
        setWatchedMovies(sortedMovies);
        setFilteredMovies(sortedMovies);
        
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

  // Search movies on TMDB with debouncing
  const handleSearchMovies = async (query) => {
    setSearchMovieQuery(query);
    setSearchError("");
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Add debounce delay to avoid too many API calls
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError(""); // Clear previous errors
        console.log("[SEARCH] Searching for:", query);
        
        const response = await api.get(`/search-movies`, {
          params: { query: query.trim() }
        });
        
        console.log("[SEARCH] Response status:", response.status);
        console.log("[SEARCH] Response data:", response.data);
        console.log("[SEARCH] Response movies count:", response.data?.movies?.length);
        
        const movies = response.data.movies || [];
        setSearchResults(movies);
        
        if (movies.length === 0) {
          console.warn("[SEARCH] No movies found for query:", query);
          setSearchError("No movies found. Try a different search term.");
        }
      } catch (error) {
        console.error("[SEARCH] Error searching movies:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to search movies";
        setSearchError(errorMsg);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300); // Wait 300ms after user stops typing
  };

  // Add movie to watched
  const handleAddMovie = async (movie) => {
    try {
      await api.post("/watched-movie/add", {
        tmdbId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        year: movie.release_date?.split("-")[0],
        language: movie.original_language,
        genreIds: movie.genre_ids || []
      });
      
      // Refresh watched movies
      const endpoint = "/profile/watched-movies";
      const response = await api.get(endpoint);
      const movies = response.data.movies || [];
      const sortedMovies = movies.sort((a, b) => {
        if (a.isPinned && b.isPinned) {
          return (a.pinOrder ?? 999) - (b.pinOrder ?? 999);
        }
        if (a.isPinned !== b.isPinned) {
          return b.isPinned ? 1 : -1;
        }
        return new Date(b.watchedAt) - new Date(a.watchedAt);
      });
      setWatchedMovies(sortedMovies);
      setFilteredMovies(sortedMovies);
      setSearchMovieQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error adding movie:", error);
      alert(error.response?.data?.message || "Failed to add movie");
    }
  };

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

  const handleDeleteAll = async () => {
    if (window.confirm("Delete ALL watched movies? This cannot be undone.")) {
      try {
        await api.delete("/watched-movies/delete-all");
        setWatchedMovies([]);
        setFilteredMovies([]);
      } catch (error) {
        console.error("Error deleting all movies:", error);
        alert("Failed to delete all movies");
      }
    }
  };

  const handlePinMovie = async (tmdbId, currentPin) => {
    try {
      await api.put(`/watched-movie/${tmdbId}/pin`, {
        isPinned: !currentPin
      });
      
      // Update locally
      setWatchedMovies((prev) => {
        const updated = prev.map((m) => 
          m.tmdbId === tmdbId ? { ...m, isPinned: !currentPin, pinOrder: !currentPin ? 0 : null } : m
        );
        // Re-sort with pinned first
        return updated.sort((a, b) => {
          if (a.isPinned && b.isPinned) {
            return (a.pinOrder ?? 999) - (b.pinOrder ?? 999);
          }
          if (a.isPinned !== b.isPinned) {
            return b.isPinned ? 1 : -1;
          }
          return new Date(b.watchedAt) - new Date(a.watchedAt);
        });
      });
    } catch (error) {
      console.error("Error pinning movie:", error);
    }
  };

  // Reorder logic shared between mouse and touch
  const performReorder = async (targetMovie) => {
    if (!draggingMovie || !targetMovie.isPinned || !draggingMovie.isPinned) return;

    // Find indices
    const dragIndex = filteredMovies.findIndex((m) => m.id === draggingMovie.id);
    const targetIndex = filteredMovies.findIndex((m) => m.id === targetMovie.id);

    if (dragIndex === targetIndex) {
      setDraggingMovie(null);
      return;
    }

    // Reorder locally
    const newMovies = [...filteredMovies];
    const [moved] = newMovies.splice(dragIndex, 1);
    newMovies.splice(targetIndex, 0, moved);

    // Get only pinned movies for reordering
    const pinnedMovies = newMovies.filter((m) => m.isPinned);
    const orderedTmdbIds = pinnedMovies.map((m) => m.tmdbId);

    setFilteredMovies(newMovies);
    setDraggingMovie(null);

    // Send to server
    try {
      await api.put("/watched-movies/reorder", {
        orderedTmdbIds
      });
    } catch (error) {
      console.error("Error reordering movies:", error);
      // Refresh on error
      const endpoint = isOwnProfile
        ? "/profile/watched-movies"
        : `/profile/user/${userId}/watched-movies`;
      const response = await api.get(endpoint);
      const movies = response.data.movies || [];
      const sortedMovies = movies.sort((a, b) => {
        if (a.isPinned && b.isPinned) {
          return (a.pinOrder ?? 999) - (b.pinOrder ?? 999);
        }
        if (a.isPinned !== b.isPinned) {
          return b.isPinned ? 1 : -1;
        }
        return new Date(b.watchedAt) - new Date(a.watchedAt);
      });
      setWatchedMovies(sortedMovies);
      setFilteredMovies(sortedMovies);
    }
  };

  // Mouse drag and drop handlers
  const handleDragStart = (e, movie) => {
    if (!movie.isPinned) return;
    setDraggingMovie(movie);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetMovie) => {
    e.preventDefault();
    await performReorder(targetMovie);
  };

  // Touch handlers for mobile drag and drop
  const handleTouchStart = (e, movie) => {
    if (!movie.isPinned) return;
    setDraggingMovie(movie);
  };

  const handleTouchMove = (e) => {
    // Prevent default scroll behavior while dragging
    if (draggingMovie) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = async (e, targetMovie) => {
    e.preventDefault();
    await performReorder(targetMovie);
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
          <div className="search-controls">
            <input
              type="text"
              placeholder="🔍 Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sheet-search-input"
            />
            {isOwnProfile && (
              <>
                <button 
                  className="btn-add-movie"
                  onClick={() => setShowAddModal(true)}
                  title="Search and add movies"
                >
                  ➕ Add Movie
                </button>
                {watchedMovies.length > 0 && (
                  <button 
                    className="btn-delete-all"
                    onClick={handleDeleteAll}
                    title="Delete all watched movies"
                  >
                    🗑️ Delete All
                  </button>
                )}
              </>
            )}
          </div>
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

        {/* Add Movie Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => {
            setShowAddModal(false);
            setSearchMovieQuery("");
            setSearchResults([]);
            setSearchError("");
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
          }}>
            <div className="search-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>🔍 Search and Add Movies</h3>
                <button 
                  className="modal-close" 
                  onClick={() => {
                    setShowAddModal(false);
                    setSearchMovieQuery("");
                    setSearchResults([]);
                    setSearchError("");
                    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                  }}
                >✕</button>
              </div>
              
              <input
                type="text"
                placeholder="Search TMDB for movies... (e.g., Inception, Avatar)"
                value={searchMovieQuery}
                onChange={(e) => handleSearchMovies(e.target.value)}
                className="modal-search-input"
                autoFocus
              />

              <div className="search-results">
                {searchError && (
                  <div className="search-error">
                    ⚠️ {searchError}
                  </div>
                )}
                {searchLoading && <div className="search-loading">🔄 Searching...</div>}
                {!searchLoading && searchMovieQuery.length >= 2 && searchResults.length === 0 && !searchError && (
                  <div className="no-results">📭 No movies found</div>
                )}
                {!searchLoading && searchMovieQuery.length === 0 && (
                  <div className="no-results">💬 Start typing to search for movies...</div>
                )}
                {searchResults.map((movie) => (
                  <div key={movie.id} className="search-result-item">
                    <img
                      src={
                        movie.poster ||
                        (movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : PLACEHOLDER_IMAGE)
                      }
                      alt={movie.title}
                      className="search-result-poster"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                    <div className="search-result-info">
                      <h4>{movie.title}</h4>
                      <p>{movie.year || movie.release_date?.split("-")[0] || "N/A"}</p>
                      <p className="result-description">{movie.overview?.substring(0, 100) || "No description"}...</p>
                    </div>
                    <button
                      className="btn-add-from-search"
                      onClick={() => handleAddMovie(movie)}
                      title="Add to watched"
                    >
                      ➕
                    </button>
                  </div>
                ))}
              </div>
            </div>
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
                <div 
                  key={movie.id} 
                  className={`movie-card-compact ${movie.isPinned ? "pinned" : ""}`}
                  draggable={movie.isPinned && isOwnProfile}
                  onDragStart={(e) => handleDragStart(e, movie)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, movie)}
                  onTouchStart={(e) => handleTouchStart(e, movie)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={(e) => handleTouchEnd(e, movie)}
                  style={{
                    opacity: draggingMovie?.id === movie.id ? 0.5 : 1,
                    cursor: movie.isPinned && isOwnProfile ? "grab" : "default",
                    touchAction: "none"
                  }}
                >
                  <div className="movie-poster-wrapper">
                    <img
                      src={
                        movie.posterPath
                          ? `https://image.tmdb.org/t/p/w300${movie.posterPath}`
                          : PLACEHOLDER_IMAGE
                      }
                      alt={movie.title}
                      className="movie-poster-compact"
                      onError={(e) => {
                        e.target.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                    {isOwnProfile && (
                      <div className="movie-overlay">
                        <button
                          className={`movie-pin-btn ${movie.isPinned ? "pinned" : ""}`}
                          onClick={() => handlePinMovie(movie.tmdbId, movie.isPinned)}
                          title={movie.isPinned ? "Unpin movie" : "Pin movie"}
                        >
                          {movie.isPinned ? "📌" : "📍"}
                        </button>
                        <button
                          className="movie-delete-btn"
                          onClick={() => handleDeleteMovie(movie.tmdbId)}
                          title="Remove from watched"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    {movie.isPinned && (
                      <div className="pinned-badge" title="Drag to reorder">
                        📌
                      </div>
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
