import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";
import "../styles/discover.css";

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

const Discover = () => {
  const [genres, setGenres] = useState([]);
  const [providers, setProviders] = useState([]);
  const [filters, setFilters] = useState({
    genre: [],
    provider: "",
    language: "en"
  });
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [wantList, setWantList] = useState(() => {
    const saved = localStorage.getItem("wantList");
    return saved ? JSON.parse(saved) : [];
  });
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [similarMode, setSimilarMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [selectedSearchMovie, setSelectedSearchMovie] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [view, setView] = useState("discover"); // "discover" or "watchlist"
  const [watchlistFilters, setWatchlistFilters] = useState({
    genre: [],
    provider: "",
    language: ""
  });

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
    const loadFilters = async () => {
      try {
        const [genreRes, providerRes] = await Promise.all([
          api.get("/genres"),
          api.get("/watchProviders?region=IN")
        ]);
        setGenres(genreRes.data || []);
        setProviders(providerRes.data || []);
      } catch (error) {
        setStatus("Failed to load filters");
      }
    };

    loadFilters();
  }, []);

  useEffect(() => {
    if (hasLoaded) return;
    if (genres.length === 0 && providers.length === 0) return;
    setHasLoaded(true);
    fetchMovies({ reset: true, nextPage: 1 });
  }, [genres, providers, hasLoaded]);

  useEffect(() => {
    localStorage.setItem("wantList", JSON.stringify(wantList));
  }, [wantList]);

  // Autocomplete search for similar movies
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
      const response = await api.get("/discoverMovies", {
        params: {
          genre: filters.genre.length ? filters.genre.join(",") : undefined,
          provider: filters.provider || undefined,
          language: filters.language || undefined,
          page: nextPage,
          region: "IN"
        }
      });

      let items = response.data || [];
      if (items.length === 0) {
        const fallback = await api.get("/popularMovies");
        items = fallback.data || [];
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
      const response = await api.get("/similarMovies", {
        params: {
          movieId: selectedSearchMovie?.tmdb_id || undefined,
          query: !selectedSearchMovie ? searchQuery : undefined
        }
      });
      setSearchResults(response.data || []);
      setSimilarMode(true);
      setIndex(0);
      setSearchSuggestions([]);
    } catch (error) {
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
    setIndex(nextIndex);
  };

  const handleAction = async (action, movie = currentMovie) => {
    if (!movie) return;

    if (action === "want") {
      const enriched = {
        ...movie,
        provider_id: filters.provider || null,
        language: filters.language || null
      };
      setWantList((prev) => {
        if (prev.find((item) => item.tmdb_id === movie.tmdb_id)) return prev;
        return [...prev, enriched];
      });
    }

    try {
      await api.post("/swipeEvent", {
        tmdbId: movie.tmdb_id,
        action,
        genreIds: movie.genre_ids || [],
        providerId: filters.provider || null,
        language: filters.language || null
      });
    } catch (error) {
      // Silent fail for analytics
    }

    moveNext();
  };

  const applyTransform = (delta) => {
    if (!swipeCardRef.current) return;
    swipeCardRef.current.style.transform = `translateX(${delta}px) rotate(${delta / 18}deg)`;
  };

  const resetTransform = () => {
    if (!swipeCardRef.current) return;
    swipeCardRef.current.style.transition = "transform 0.2s ease";
    swipeCardRef.current.style.transform = "translateX(0) rotate(0deg)";
    window.setTimeout(() => {
      if (swipeCardRef.current) {
        swipeCardRef.current.style.transition = "";
      }
    }, 220);
  };

  const animateSwipe = (direction) => {
    if (!swipeCardRef.current || swipeInProgressRef.current) return;
    swipeInProgressRef.current = true;
    const width = window.innerWidth || 600;
    const target = direction === "right" ? width : -width;
    swipeCardRef.current.style.transition = "transform 0.25s ease";
    swipeCardRef.current.style.transform = `translateX(${target}px) rotate(${target / 18}deg)`;
    window.setTimeout(async () => {
      await handleAction(direction === "right" ? "nah" : "watched");
      swipeInProgressRef.current = false;
      if (swipeCardRef.current) {
        swipeCardRef.current.style.transition = "";
        swipeCardRef.current.style.transform = "translateX(0) rotate(0deg)";
      }
    }, 230);
  };

  const onPointerDown = (event) => {
    if (swipeInProgressRef.current) return;
    pointerStart.current = event.clientX;
    cardOffsetRef.current = 0;
    isDraggingRef.current = false;
    setIsDragging(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (pointerStart.current === null) return;
    const delta = event.clientX - pointerStart.current;
    cardOffsetRef.current = delta;
    if (!rafRef.current) {
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        applyTransform(cardOffsetRef.current);
      });
    }
    if (Math.abs(delta) > 6 && !isDraggingRef.current) {
      isDraggingRef.current = true;
      setIsDragging(true);
    }
  };

  const onPointerUp = () => {
    if (pointerStart.current === null) return;
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
  };

  const handleCardClick = () => {
    if (isDragging || swipeInProgressRef.current) return;
    handleAction("want");
  };

  const toggleGenreWatchlist = (genreId) => {
    setWatchlistFilters((prev) => {
      const exists = prev.genre.includes(genreId);
      return {
        ...prev,
        genre: exists
          ? prev.genre.filter((id) => id !== genreId)
          : [...prev.genre, genreId]
      };
    });
  };

  const handleRemoveFromWatchlist = (tmdbId) => {
    setWantList((prev) => prev.filter((movie) => movie.tmdb_id !== tmdbId));
  };

  const filteredWatchlist = wantList.filter((movie) => {
    const matchesGenre =
      watchlistFilters.genre.length === 0 ||
      watchlistFilters.genre.some((id) => movie.genre_ids?.includes(Number(id)) || movie.genre_ids?.includes(id));

    const matchesProvider =
      !watchlistFilters.provider ||
      String(movie.provider_id || "") === String(watchlistFilters.provider);

    const matchesLanguage =
      !watchlistFilters.language ||
      movie.language === watchlistFilters.language;

    return matchesGenre && matchesProvider && matchesLanguage;
  });

  const formatGenres = (ids = []) =>
    ids.map((id) => genreMap[id]).filter(Boolean).join(" • ");

  return (
    <div className="discover-page">
      <div className="discover-header">
        <div>
          <h1>Discover</h1>
          <p className="helper-text">
            {view === "discover"
              ? "Swipe right for nah, left for watched. Tap to mark \"want to watch\"."
              : "Your saved picks from Discover."}
          </p>
        </div>
        <div className="view-tabs">
          <button
            className={`view-tab ${view === "discover" ? "active" : ""}`}
            onClick={() => setView("discover")}
          >
            Browse
          </button>
          <button
            className={`view-tab ${view === "watchlist" ? "active" : ""}`}
            onClick={() => setView("watchlist")}
          >
            Watchlist ({wantList.length})
          </button>
        </div>
      </div>

      {view === "discover" ? (
        <>
          <div className="filter-panel">
        <div className="filter-row">
          <div className="filter-group">
            <label>Genres</label>
            <div className="genre-dropdown-container">
              <button
                type="button"
                className="genre-dropdown-trigger"
                onClick={() => setShowGenreDropdown(!showGenreDropdown)}
              >
                {filters.genre.length === 0 ? "Select genres..." : `${filters.genre.length} selected`}
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
            <label>Platform</label>
            <select
              className="filter-select"
              value={filters.provider}
              onChange={(event) => setFilters((prev) => ({
                ...prev,
                provider: event.target.value
              }))}
            >
              <option value="">Any</option>
              {providers.map((provider) => (
                <option key={provider.provider_id} value={provider.provider_id}>
                  {provider.provider_name}
                </option>
              ))}
            </select>
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
                    <span>⭐ {thirdMovie.rating.toFixed(1)}</span>
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
                    <span>⭐ {nextMovie.rating.toFixed(1)}</span>
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
                  <span>⭐ {currentMovie.rating.toFixed(1)}</span>
                  {currentMovie.genre_ids?.length > 0 && (
                    <span>{formatGenres(currentMovie.genre_ids)}</span>
                  )}
                </div>
                <p className="swipe-overview">
                  {currentMovie.overview || "No overview available."}
                </p>
                <div className="swipe-hint">Tap the card to add to Want list</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="swipe-actions">
        <button className="action-btn ghost" onClick={() => handleAction("watched")}>
          Watched
        </button>
        <button className="action-btn primary" onClick={() => handleAction("want")}>
          Want to Watch
        </button>
        <button className="action-btn ghost" onClick={() => handleAction("nah")}>
          Nah
        </button>
      </div>
      </>
      ) : (
        <>
          <div className="watchlist-filters">
        <div className="filter-group">
          <label>Genres</label>
          <div className="genre-grid">
            {genres.map((genre) => (
              <button
                key={genre.id}
                type="button"
                className={`genre-chip ${
                  watchlistFilters.genre.includes(String(genre.id)) ? "active" : ""
                }`}
                onClick={() => toggleGenreWatchlist(String(genre.id))}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-row">
          <div className="filter-group">
            <label>Platform</label>
            <select
              className="filter-select"
              value={watchlistFilters.provider}
              onChange={(event) => setWatchlistFilters((prev) => ({
                ...prev,
                provider: event.target.value
              }))}
            >
              <option value="">Any</option>
              {providers.map((provider) => (
                <option key={provider.provider_id} value={provider.provider_id}>
                  {provider.provider_name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Language</label>
            <select
              className="filter-select"
              value={watchlistFilters.language}
              onChange={(event) => setWatchlistFilters((prev) => ({
                ...prev,
                language: event.target.value
              }))}
            >
              <option value="">Any</option>
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredWatchlist.length === 0 ? (
        <div className="empty-card">
          <h2>No movies in watchlist</h2>
          <p className="helper-text">Switch to Browse mode and start adding movies!</p>
        </div>
      ) : (
        <div className="watchlist-grid">
          {filteredWatchlist.map((movie) => (
            <div key={movie.tmdb_id} className="watchlist-card">
              <div className="watchlist-poster">
                {movie.poster ? (
                  <img src={movie.poster} alt={movie.title} />
                ) : (
                  <div className="poster-fallback" />
                )}
              </div>
              <div className="watchlist-body">
                <div className="watchlist-title">
                  <h3>{movie.title}</h3>
                  <span>{movie.year}</span>
                </div>
                <div className="watchlist-meta">
                  <span>⭐ {movie.rating?.toFixed ? movie.rating.toFixed(1) : movie.rating}</span>
                  {movie.genre_ids?.length > 0 && (
                    <span>{formatGenres(movie.genre_ids)}</span>
                  )}
                </div>
                <p className="watchlist-overview">
                  {movie.overview || "No overview available."}
                </p>
                <button
                  className="action-btn ghost"
                  onClick={() => handleRemoveFromWatchlist(movie.tmdb_id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default Discover;
