import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";
import "../styles/nextShow.css";

const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "te", label: "Telugu" },
  { code: "ta", label: "Tamil" },
  { code: "ml", label: "Malayalam" },
  { code: "bn", label: "Bengali" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" }
];

const NextShow = () => {
  const [genres, setGenres] = useState([]);
  const [filters, setFilters] = useState({
    genre: [],
    language: "en"
  });
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState("");
  const [stats, setStats] = useState({
    watched: 0,
    interested: 0,
    passed: 0,
    swipeCount: 0
  });
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [similarMode, setSimilarMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [selectedSearchMovie, setSelectedSearchMovie] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [cardHistory, setCardHistory] = useState([]);

  const pointerStart = useRef(null);
  const swipeCardRef = useRef(null);
  const cardOffsetRef = useRef(0);
  const rafRef = useRef(null);
  const isDraggingRef = useRef(false);
  const swipeInProgressRef = useRef(false);

  const genreMap = useMemo(() => {
    const map = {};
    genres.forEach((genre) => {
      map[genre.id] = genre.name;
    });
    return map;
  }, [genres]);

  const activeMovies = similarMode ? searchResults : movies;
  const currentMovie = activeMovies[index];
  const nextMovie = activeMovies[index + 1];
  const thirdMovie = activeMovies[index + 2];

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const response = await api.get("/genres");
        setGenres(response.data || []);
      } catch (error) {
        console.error("Failed to load genres:", error);
      }
    };
    loadGenres();
  }, []);

  useEffect(() => {
    if (genres.length > 0) {
      fetchMovies({ reset: true, nextPage: 1 });
    }
  }, [genres]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await api.get(`/searchMovie?q=${encodeURIComponent(searchQuery)}`);
        setSearchSuggestions(response.data.slice(0, 6));
      } catch (error) {
        setSearchSuggestions([]);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const fetchMovies = async ({ reset = true, nextPage = 1 } = {}) => {
    setLoading(true);
    setStatus("");
    try {
      const response = await api.get("/api/next-show/movies", {
        params: {
          genres: filters.genre.length ? filters.genre.join(",") : undefined,
          language: filters.language || undefined,
          page: nextPage,
          limit: 50
        }
      });

      let items = response.data.data?.movies || response.data || [];
      
      if (items.length === 0) {
        const fallback = await api.get("/api/recommendations?limit=50");
        items = fallback.data.data?.recommendations || [];
      }

      if (reset) {
        setMovies(items);
        setIndex(0);
        setPage(nextPage);
      } else {
        setMovies((prev) => [...prev, ...items]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      setStatus("Failed to load movies");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    fetchMovies({ reset: true, nextPage: 1 });
  };

  const searchSimilarMovies = async () => {
    if (!selectedSearchMovie && !searchQuery.trim()) {
      setStatus("Please select or enter a movie name");
      return;
    }

    setIsSearching(true);
    setStatus("");
    try {
      const response = await api.get("/api/next-show/similar-movies", {
        params: {
          movieId: selectedSearchMovie?.tmdb_id || selectedSearchMovie?.id,
          limit: 50
        }
      });
      setSearchResults(response.data.data?.similar_movies || response.data);
      setSimilarMode(true);
      setIndex(0);
      setSearchSuggestions([]);
    } catch (error) {
      console.error("Error finding similar movies:", error);
      setStatus("Failed to find similar movies");
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchMovie = (movie) => {
    setSelectedSearchMovie(movie);
    setSearchQuery(movie.title);
    setSearchSuggestions([]);
  };

  const exitSimilarMode = () => {
    setSimilarMode(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedSearchMovie(null);
    setSearchSuggestions([]);
    setIndex(0);
    setCardHistory([]);
  };

  const toggleGenre = (genreId) => {
    setFilters((prev) => {
      const exists = prev.genre.includes(genreId);
      return {
        ...prev,
        genre: exists
          ? prev.genre.filter((id) => id !== genreId)
          : [...prev.genre, genreId]
      };
    });
    setShowGenreDropdown(false);
  };

  const moveNext = () => {
    const nextIndex = index + 1;
    if (similarMode) {
      if (nextIndex >= searchResults.length) {
        setStatus("No more similar movies");
        setIndex(nextIndex - 1);
        return;
      }
    } else {
      if (nextIndex >= movies.length - 2) {
        fetchMovies({ reset: false, nextPage: page + 1 });
      }
    }
    setCardHistory((prev) => [...prev, index]);
    setIndex(nextIndex);
  };

  const handleAction = async (action, movie = currentMovie) => {
    if (!movie) return;

    try {
      await api.post("/api/next-show/record-swipe", {
        tmdbId: movie.id || movie.tmdb_id,
        movieTitle: movie.title,
        action,
        genres: movie.genre_ids || [],
        language: filters.language,
        director: movie.director || null,
        cast: movie.cast || [],
        platform: null
      });

      setStats((prev) => ({
        ...prev,
        [action]: prev[action] + 1,
        swipeCount: prev.swipeCount + 1
      }));
    } catch (error) {
      console.error("Error recording swipe:", error);
    }

    moveNext();
  };

  const applyTransform = (delta) => {
    if (!swipeCardRef.current) return;
    const rotation = (delta / 20) * Math.sign(delta) * Math.min(Math.abs(delta) / 150, 1);
    swipeCardRef.current.style.transform = `translateX(${delta}px) rotate(${rotation}deg)`;
  };

  const resetTransform = () => {
    if (!swipeCardRef.current) return;
    swipeCardRef.current.style.transition = "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
    swipeCardRef.current.style.transform = "translateX(0) rotate(0deg)";
    window.setTimeout(() => {
      if (swipeCardRef.current) {
        swipeCardRef.current.style.transition = "";
      }
    }, 300);
  };

  const animateSwipe = (direction) => {
    if (!swipeCardRef.current || swipeInProgressRef.current) return;
    swipeInProgressRef.current = true;
    const width = window.innerWidth || 600;
    const target = direction === "right" ? width * 1.2 : -width * 1.2;
    const rotation = direction === "right" ? 25 : -25;
    swipeCardRef.current.style.transition = "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
    swipeCardRef.current.style.transform = `translateX(${target}px) rotate(${rotation}deg)`;
    window.setTimeout(async () => {
      await handleAction(direction === "right" ? "watched" : "passed");
      swipeInProgressRef.current = false;
      document.body.classList.remove('swiping');
      if (swipeCardRef.current) {
        swipeCardRef.current.style.transition = "";
        swipeCardRef.current.style.transform = "translateX(0) rotate(0deg)";
      }
    }, 400);
  };

  const onPointerDown = (event) => {
    if (swipeInProgressRef.current) return;
    event.preventDefault();
    document.body.classList.add('swiping');
    pointerStart.current = event.clientX;
    cardOffsetRef.current = 0;
    isDraggingRef.current = false;
    setIsDragging(false);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (e) {
      //
    }
  };

  const onPointerMove = (event) => {
    if (pointerStart.current === null) return;
    event.preventDefault();
    const delta = event.clientX - pointerStart.current;
    cardOffsetRef.current = delta;
    if (!rafRef.current) {
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        applyTransform(cardOffsetRef.current);
      });
    }
    if (Math.abs(delta) > 8 && !isDraggingRef.current) {
      isDraggingRef.current = true;
      setIsDragging(true);
    }
  };

  const onPointerUp = (event) => {
    if (pointerStart.current === null) return;
    event.preventDefault();
    document.body.classList.remove('swiping');
    const threshold = 120;
    const delta = cardOffsetRef.current;
    if (delta > threshold) {
      animateSwipe("right");
    } else if (delta < -threshold) {
      animateSwipe("left");
    } else {
      resetTransform();
    }
    pointerStart.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch (e) {
      //
    }
  };

  const handleCardClick = () => {
    if (isDragging || swipeInProgressRef.current) return;
    handleAction("interested");
  };

  const formatGenres = (genreIds) => {
    return genreIds
      .slice(0, 2)
      .map((id) => genreMap[id])
      .filter(Boolean)
      .join(", ");
  };

  return (
    <div className="discover-page">
      <div className="discover-header">
        <h1>Next Show</h1>
        <div className="discover-stats">
          <div className="stat-card">
            <span className="stat-label">Watched</span>
            <span className="stat-value">{stats.watched}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Interested</span>
            <span className="stat-value">{stats.interested}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Passed</span>
            <span className="stat-value">{stats.passed}</span>
          </div>
        </div>
      </div>

      <div className="discover-content">
        <div className="filter-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label>Genres</label>
              <div className="genre-dropdown-container">
                <button
                  className="genre-dropdown-trigger"
                  onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                >
                  {filters.genre.length > 0 ? `${filters.genre.length} selected` : "Select genres"}
                  <span className="dropdown-arrow">▼</span>
                </button>
                {showGenreDropdown && (
                  <div className="genre-dropdown-menu">
                    {genres.map((genre) => (
                      <label key={genre.id} className="genre-option">
                        <input
                          type="checkbox"
                          checked={filters.genre.includes(String(genre.id))}
                          onChange={() => toggleGenre(String(genre.id))}
                        />
                        <span>{genre.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                {filters.genre.length > 0 && (
                  <div className="genre-tags">
                    {filters.genre.map((genreId) => (
                      <span key={genreId} className="genre-tag">
                        {genreMap[genreId]}
                        <button
                          type="button"
                          onClick={() => toggleGenre(genreId)}
                          className="tag-remove"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="filter-group">
              <label>Language</label>
              <select
                className="filter-select"
                value={filters.language}
                onChange={(event) => setFilters((prev) => ({
                  ...prev,
                  language: event.target.value
                }))}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="primary filter-cta" onClick={applyFilters}>
            Find Movies
          </button>
        </div>

        <div className="similar-search-row">
          <div className="similar-search-wrapper">
            <input
              type="text"
              className="similar-search-input"
              placeholder="Search a movie to find similar ones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchSimilarMovies()}
            />
            {searchSuggestions.length > 0 && (
              <div className="similar-suggestions-list">
                {searchSuggestions.map((movie) => (
                  <div
                    key={movie.tmdb_id}
                    className="similar-suggestion-item"
                    onClick={() => selectSearchMovie(movie)}
                  >
                    {movie.poster && (
                      <img src={movie.poster} alt={movie.title} className="suggestion-poster" />
                    )}
                    <div className="suggestion-info">
                      <p className="suggestion-title">{movie.title}</p>
                      <p className="suggestion-year">{movie.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            className="primary"
            onClick={searchSimilarMovies}
            disabled={isSearching}
          >
            {isSearching ? "Searching..." : "Find Similar"}
          </button>
          {similarMode && (
            <button className="secondary" onClick={exitSimilarMode}>
              Back to Browse
            </button>
          )}
        </div>

        {status && <p className="helper-text">{status}</p>}
      </div>

      <div className="swipe-stage">
        {loading && <p className="helper-text">Loading suggestions...</p>}
        {!loading && !currentMovie && (
          <div className="empty-card">
            <h2>No more movies</h2>
            <p className="helper-text">Refine filters and fetch again.</p>
          </div>
        )}
        {currentMovie && (
          <div className="swipe-stack">
            {thirdMovie && (
              <div className="swipe-card swipe-card-back swipe-card-back-2">
                <div className="swipe-poster">
                  {thirdMovie.poster ? (
                    <img src={thirdMovie.poster} alt={thirdMovie.title} />
                  ) : (
                    <div className="poster-fallback" />
                  )}
                </div>
                <div className="swipe-body">
                  <div className="swipe-title">
                    <h2>{thirdMovie.title}</h2>
                    <span>{thirdMovie.year}</span>
                  </div>
                  <div className="swipe-meta">
                    <span>⭐ {thirdMovie.rating?.toFixed(1) || 'N/A'}</span>
                    {thirdMovie.genre_ids?.length > 0 && (
                      <span>{formatGenres(thirdMovie.genre_ids)}</span>
                    )}
                  </div>
                  <p className="swipe-overview">
                    {thirdMovie.overview || "No overview available."}
                  </p>
                </div>
              </div>
            )}
            {nextMovie && (
              <div className="swipe-card swipe-card-back">
                <div className="swipe-poster">
                  {nextMovie.poster ? (
                    <img src={nextMovie.poster} alt={nextMovie.title} />
                  ) : (
                    <div className="poster-fallback" />
                  )}
                </div>
                <div className="swipe-body">
                  <div className="swipe-title">
                    <h2>{nextMovie.title}</h2>
                    <span>{nextMovie.year}</span>
                  </div>
                  <div className="swipe-meta">
                    <span>⭐ {nextMovie.rating?.toFixed(1) || 'N/A'}</span>
                    {nextMovie.genre_ids?.length > 0 && (
                      <span>{formatGenres(nextMovie.genre_ids)}</span>
                    )}
                  </div>
                  <p className="swipe-overview">
                    {nextMovie.overview || "No overview available."}
                  </p>
                </div>
              </div>
            )}

            <div
              className="swipe-card swipe-card-front"
              ref={swipeCardRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              onClick={handleCardClick}
            >
              <div className="swipe-poster">
                {currentMovie.poster ? (
                  <img src={currentMovie.poster} alt={currentMovie.title} />
                ) : (
                  <div className="poster-fallback" />
                )}
              </div>
              <div className="swipe-body">
                <div className="swipe-title">
                  <h2>{currentMovie.title}</h2>
                  <span>{currentMovie.year}</span>
                </div>
                <div className="swipe-meta">
                  <span>⭐ {currentMovie.rating?.toFixed(1) || 'N/A'}</span>
                  {currentMovie.genre_ids?.length > 0 && (
                    <span>{formatGenres(currentMovie.genre_ids)}</span>
                  )}
                </div>
                <p className="swipe-overview">
                  {currentMovie.overview || "No overview available."}
                </p>
                <div className="action-buttons">
                  <button
                    className="action-btn passed"
                    onClick={() => handleAction("passed")}
                    title="Skip (Swipe Left)"
                  >
                    ✕ Pass
                  </button>
                  <button
                    className="action-btn interested"
                    onClick={() => handleAction("interested")}
                    title="Add to Watchlist (Click)"
                  >
                    ♡ Interested
                  </button>
                  <button
                    className="action-btn watched"
                    onClick={() => handleAction("watched")}
                    title="Watched (Swipe Right)"
                  >
                    ✓ Watched
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NextShow;
