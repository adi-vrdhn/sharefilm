import React, { useState, useEffect } from "react";
import { Check, ChevronRight, Search, X } from "lucide-react";
import api from "../api/axios";
import "../styles/nextShowFilters.css";

const NextShowFilters = ({ onFiltersApplied }) => {
  const [genres, setGenres] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [selectedSearchMovie, setSelectedSearchMovie] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Predefined options
  const languageOptions = [
    { code: "en", name: "English" },
    { code: "hi", name: "Hindi" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "ja", name: "Japanese" },
    { code: "zh", name: "Chinese" },
    { code: "ko", name: "Korean" },
    { code: "te", name: "Telugu" },
    { code: "ta", name: "Tamil" },
    { code: "ml", name: "Malayalam" },
  ];

  const platformOptions = [
    { id: "netflix", name: "Netflix" },
    { id: "amazon", name: "Amazon Prime" },
    { id: "disney", name: "Disney+" },
    { id: "hulu", name: "Hulu" },
    { id: "paramount", name: "Paramount+" },
    { id: "hbo", name: "HBO Max" },
    { id: "apple", name: "Apple TV+" },
  ];

  // Fetch genres from TMDB
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/tmdb/genres");
        setGenres(response.data.data.genres || []);
      } catch (err) {
        console.error("Error fetching genres:", err);
        setError("Failed to load genres");
        // Fallback genres
        setGenres([
          { id: 28, name: "Action" },
          { id: 35, name: "Comedy" },
          { id: 18, name: "Drama" },
          { id: 10751, name: "Family" },
          { id: 14, name: "Fantasy" },
          { id: 36, name: "History" },
          { id: 27, name: "Horror" },
          { id: 10749, name: "Romance" },
          { id: 878, name: "Science Fiction" },
          { id: 53, name: "Thriller" },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchGenres();
  }, []);

  // Autocomplete search for movies
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await api.get(`/searchMovie?q=${encodeURIComponent(searchQuery)}`);
        setSearchSuggestions(response.data.slice(0, 8));
      } catch (error) {
        setSearchSuggestions([]);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const toggleGenre = (genreId) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((g) => g !== genreId) : [...prev, genreId]
    );
  };

  const toggleLanguage = (code) => {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    );
  };

  const togglePlatform = (id) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleStartSwiping = () => {
    onFiltersApplied({
      genres: selectedGenres,
      languages: selectedLanguages,
      platforms: selectedPlatforms,
      searchMovie: selectedSearchMovie,
    });
  };

  const selectSearchMovie = (movie) => {
    setSelectedSearchMovie(movie);
    setSearchQuery(movie.title);
    setSearchSuggestions([]);
  };

  const clearSearchMovie = () => {
    setSelectedSearchMovie(null);
    setSearchQuery("");
    setSearchSuggestions([]);
  };

  const handleSelectAll = (type) => {
    if (type === "genres") {
      setSelectedGenres(selectedGenres.length === genres.length ? [] : genres.map((g) => g.id));
    } else if (type === "languages") {
      setSelectedLanguages(selectedLanguages.length === languageOptions.length ? [] : languageOptions.map((l) => l.code));
    } else if (type === "platforms") {
      setSelectedPlatforms(selectedPlatforms.length === platformOptions.length ? [] : platformOptions.map((p) => p.id));
    }
  };

  return (
    <div className="next-show-filters-container">
      {/* Header */}
      <div className="filters-header">
        <h1>NEXT SHOW</h1>
        <p className="tagline">Let's find your next favorite movie</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loader">Loading options...</div>
      ) : (
        <div className="filters-content">
          {/* Search Box */}
          <div className="filter-section search-section">
            <h2>Search for a movie</h2>
            <div className="search-container">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search a movie to get similar suggestions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  className="clear-search-btn"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchSuggestions([]);
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Search Suggestions */}
            {searchSuggestions.length > 0 && (
              <div className="search-suggestions">
                {searchSuggestions.map((movie) => (
                  <button
                    key={movie.tmdb_id}
                    className="suggestion-item"
                    onClick={() => selectSearchMovie(movie)}
                  >
                    <div className="suggestion-poster">
                      {movie.poster_path && (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                          alt={movie.title}
                        />
                      )}
                    </div>
                    <div className="suggestion-info">
                      <div className="suggestion-title">{movie.title}</div>
                      <div className="suggestion-year">
                        {movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedSearchMovie && (
              <div className="selected-search-movie">
                <div className="selected-movie-content">
                  <div className="selected-movie-poster">
                    {selectedSearchMovie.poster_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w154${selectedSearchMovie.poster_path}`}
                        alt={selectedSearchMovie.title}
                      />
                    )}
                  </div>
                  <div className="selected-movie-info">
                    <div className="selected-movie-title">{selectedSearchMovie.title}</div>
                    <div className="selected-movie-year">
                      {selectedSearchMovie.release_date ? new Date(selectedSearchMovie.release_date).getFullYear() : "N/A"}
                    </div>
                  </div>
                </div>
                <button
                  className="remove-search-btn"
                  onClick={clearSearchMovie}
                >
                  <X size={20} />
                </button>
              </div>
            )}

            <p className="filter-note search-note">
              {selectedSearchMovie ? "✓ Movie selected. Start swiping to find similar movies!" : "Optional: Search to find movies similar to your selection"}
            </p>
          </div>

          {/* Genres Filter */}
          <div className="filter-section">
            <div className="filter-title-row">
              <h2>Genres</h2>
              <button
                className="select-all-btn"
                onClick={() => handleSelectAll("genres")}
              >
                {selectedGenres.length === genres.length ? "Clear All" : "Select All"}
              </button>
            </div>
            <div className="filter-options genres-grid">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  className={`filter-tag ${selectedGenres.includes(genre.id) ? "active" : ""}`}
                  onClick={() => toggleGenre(genre.id)}
                >
                  {selectedGenres.includes(genre.id) && <Check size={16} />}
                  {genre.name}
                </button>
              ))}
            </div>
            <p className="filter-note">Selected: {selectedGenres.length || "Any"}</p>
          </div>

          {/* Languages Filter */}
          <div className="filter-section">
            <div className="filter-title-row">
              <h2>Languages</h2>
              <button
                className="select-all-btn"
                onClick={() => handleSelectAll("languages")}
              >
                {selectedLanguages.length === languageOptions.length ? "Clear All" : "Select All"}
              </button>
            </div>
            <div className="filter-options languages-grid">
              {languageOptions.map((lang) => (
                <button
                  key={lang.code}
                  className={`filter-tag ${selectedLanguages.includes(lang.code) ? "active" : ""}`}
                  onClick={() => toggleLanguage(lang.code)}
                >
                  {selectedLanguages.includes(lang.code) && <Check size={16} />}
                  {lang.name}
                </button>
              ))}
            </div>
            <p className="filter-note">Selected: {selectedLanguages.length || "Any"}</p>
          </div>

          {/* Platforms Filter */}
          <div className="filter-section">
            <div className="filter-title-row">
              <h2>Streaming Platforms</h2>
              <button
                className="select-all-btn"
                onClick={() => handleSelectAll("platforms")}
              >
                {selectedPlatforms.length === platformOptions.length ? "Clear All" : "Select All"}
              </button>
            </div>
            <div className="filter-options platforms-grid">
              {platformOptions.map((platform) => (
                <button
                  key={platform.id}
                  className={`filter-tag ${selectedPlatforms.includes(platform.id) ? "active" : ""}`}
                  onClick={() => togglePlatform(platform.id)}
                >
                  {selectedPlatforms.includes(platform.id) && <Check size={16} />}
                  {platform.name}
                </button>
              ))}
            </div>
            <p className="filter-note">Selected: {selectedPlatforms.length || "Any"}</p>
          </div>
        </div>
      )}

      {/* Start Button */}
      <div className="filter-actions">
        <button
          className="start-swiping-btn"
          onClick={handleStartSwiping}
          disabled={loading}
        >
          Start Swiping
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default NextShowFilters;
