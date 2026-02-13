import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import "../styles/watchlist.css";

const LANGUAGE_OPTIONS = [
  { code: "", label: "Any" },
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "te", label: "Telugu" },
  { code: "ta", label: "Tamil" },
  { code: "ml", label: "Malayalam" },
  { code: "bn", label: "Bengali" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" }
];

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem("wantList");
    return saved ? JSON.parse(saved) : [];
  });
  const [genres, setGenres] = useState([]);
  const [providers, setProviders] = useState([]);
  const [filters, setFilters] = useState({
    genre: [],
    provider: "",
    language: ""
  });
  const [status, setStatus] = useState("");

  const genreMap = useMemo(() => {
    const map = {};
    genres.forEach((genre) => {
      map[genre.id] = genre.name;
    });
    return map;
  }, [genres]);

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
    localStorage.setItem("wantList", JSON.stringify(watchlist));
  }, [watchlist]);

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
  };

  const handleRemove = (tmdbId) => {
    setWatchlist((prev) => prev.filter((movie) => movie.tmdb_id !== tmdbId));
  };

  const filteredList = watchlist.filter((movie) => {
    const matchesGenre =
      filters.genre.length === 0 ||
      filters.genre.some((id) => movie.genre_ids?.includes(Number(id)) || movie.genre_ids?.includes(id));

    const matchesProvider =
      !filters.provider ||
      String(movie.provider_id || "") === String(filters.provider);

    const matchesLanguage =
      !filters.language ||
      movie.language === filters.language;

    return matchesGenre && matchesProvider && matchesLanguage;
  });

  const formatGenres = (ids = []) =>
    ids.map((id) => genreMap[id]).filter(Boolean).join(" • ");

  return (
    <div className="watchlist-page">
      <div className="watchlist-header">
        <div>
          <h1>Watchlist</h1>
          <p className="helper-text">Your saved picks from Discover.</p>
        </div>
        <div className="watchlist-count">{watchlist.length} saved</div>
      </div>

      <div className="watchlist-filters">
        <div className="filter-group">
          <label>Genres</label>
          <div className="genre-grid">
            {genres.map((genre) => (
              <button
                key={genre.id}
                type="button"
                className={`genre-chip ${
                  filters.genre.includes(String(genre.id)) ? "active" : ""
                }`}
                onClick={() => toggleGenre(String(genre.id))}
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
        </div>
        {status && <p className="helper-text">{status}</p>}
      </div>

      {filteredList.length === 0 ? (
        <div className="empty-card">
          <h2>No movies found</h2>
          <p className="helper-text">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="watchlist-grid">
          {filteredList.map((movie) => (
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
                  onClick={() => handleRemove(movie.tmdb_id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Watchlist;
