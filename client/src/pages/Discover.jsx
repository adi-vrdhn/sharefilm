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
    genre: "",
    provider: "",
    language: "en"
  });
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cardOffset, setCardOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState("");
  const [wantList, setWantList] = useState(() => {
    const saved = localStorage.getItem("wantList");
    return saved ? JSON.parse(saved) : [];
  });

  const pointerStart = useRef(null);

  const genreMap = useMemo(() => {
    const map = {};
    genres.forEach((genre) => {
      map[genre.id] = genre.name;
    });
    return map;
  }, [genres]);

  const currentMovie = movies[index];

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
    localStorage.setItem("wantList", JSON.stringify(wantList));
  }, [wantList]);

  const fetchMovies = async ({ reset = true, nextPage = 1 } = {}) => {
    setLoading(true);
    setStatus("");
    try {
      const response = await api.get("/discoverMovies", {
        params: {
          genre: filters.genre || undefined,
          provider: filters.provider || undefined,
          language: filters.language || undefined,
          page: nextPage,
          region: "IN"
        }
      });

      const items = response.data || [];
      if (reset) {
        setMovies(items);
        setIndex(0);
        setPage(nextPage);
      } else {
        setMovies((prev) => [...prev, ...items]);
        setPage(nextPage);
      }

      if (items.length === 0) {
        setStatus("No movies found. Try different filters.");
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

  const moveNext = () => {
    if (index + 1 >= movies.length) {
      fetchMovies({ reset: false, nextPage: page + 1 });
      setIndex((prev) => prev + 1);
      return;
    }
    setIndex((prev) => prev + 1);
  };

  const handleAction = async (action, movie = currentMovie) => {
    if (!movie) return;

    if (action === "want") {
      setWantList((prev) => {
        if (prev.find((item) => item.tmdb_id === movie.tmdb_id)) return prev;
        return [...prev, movie];
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

  const onPointerDown = (event) => {
    pointerStart.current = event.clientX;
    setIsDragging(false);
  };

  const onPointerMove = (event) => {
    if (pointerStart.current === null) return;
    const delta = event.clientX - pointerStart.current;
    setCardOffset(delta);
    if (Math.abs(delta) > 6) {
      setIsDragging(true);
    }
  };

  const onPointerUp = () => {
    if (pointerStart.current === null) return;
    const threshold = 120;
    if (cardOffset > threshold) {
      handleAction("nah");
    } else if (cardOffset < -threshold) {
      handleAction("watched");
    }
    setCardOffset(0);
    pointerStart.current = null;
    setIsDragging(false);
  };

  const handleCardClick = () => {
    if (isDragging) return;
    handleAction("want");
  };

  const formatGenres = (ids = []) =>
    ids.map((id) => genreMap[id]).filter(Boolean).join(" • ");

  return (
    <div className="discover-page">
      <div className="discover-header">
        <div>
          <h1>Discover</h1>
          <p className="helper-text">
            Swipe right for nah, left for watched. Tap to mark “want to watch”.
          </p>
        </div>
        <div className="discover-stats">
          <div className="stat-card">
            <span className="stat-label">Want list</span>
            <span className="stat-value">{wantList.length}</span>
          </div>
        </div>
      </div>

      <div className="filter-panel">
        <div className="filter-row">
          <div className="filter-group">
            <label>Genre</label>
            <select
              className="filter-select"
              value={filters.genre}
              onChange={(event) => setFilters((prev) => ({
                ...prev,
                genre: event.target.value
              }))}
            >
              <option value="">Any</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>
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
          <div
            className="swipe-card"
            style={{ transform: `translateX(${cardOffset}px) rotate(${cardOffset / 18}deg)` }}
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
    </div>
  );
};

export default Discover;
