import React, { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "../styles/tasteProfile.css";

const MovieMatcher = () => {
  const { user } = useAuth();
  const [view, setView] = useState("main"); // main | addMovie | matchResult
  const [myMovies, setMyMovies] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Add Movie Modal State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchDebounceRef = useRef(null);

  // Smart Suggestions State
  const [selectedForSuggestions, setSelectedForSuggestions] = useState(null);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  
  // Profile suggestions state
  const [profileSuggestions, setProfileSuggestions] = useState([]);
  const [profileSuggestionsLoading, setProfileSuggestionsLoading] = useState(false);

  // Match Result State
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [matchResult, setMatchResult] = useState(null);

  // Load user's taste movies on mount
  useEffect(() => {
    loadMyTasteMovies();
    loadFriends();
  }, []);

  // Auto-load profile suggestions when entering AddMovie view and when myMovies changes
  useEffect(() => {
    if (view === "addMovie" && myMovies.length > 0 && !searchQuery) {
      loadProfileSuggestions();
    }
  }, [view, myMovies, searchQuery]);

  // Debounced search
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (searchQuery.length < 2) {
      setSearchResults([]);
      // When search is cleared, reload profile suggestions
      if (view === "addMovie" && myMovies.length > 0) {
        loadProfileSuggestions();
      }
      return;
    }

    setSearching(true);
    searchDebounceRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300); // 300ms debounce

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery]);

  const loadMyTasteMovies = async () => {
    try {
      const response = await api.get("/taste/my-movies");
      setMyMovies(response.data.movies || []);
    } catch (err) {
      console.error("Error loading taste movies:", err);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await api.get("/getFriends");
      setFriends(response.data || []);
    } catch (err) {
      console.error("Error loading friends:", err);
      setFriends([]); // Continue without friends
    }
  };

  // Load suggestions for entire profile
  const loadProfileSuggestions = async () => {
    if (myMovies.length === 0) {
      setProfileSuggestions([]);
      return;
    }

    setProfileSuggestionsLoading(true);
    try {
      const movieIds = myMovies.map(m => m.tmdb_id);
      console.log("🎬 Loading suggestions for profile with", movieIds.length, "movies");
      
      const response = await api.post("/smart-suggestions/profile", {
        movieIds
      });
      
      console.log("✅ Got profile suggestions:", response.data.suggestions?.length || 0);
      setProfileSuggestions(response.data.suggestions || []);
      // Auto-select the profile as the source for suggestions display
      setSelectedForSuggestions({
        title: "Your Taste Profile",
        id: "profile"
      });
      setSimilarMovies(response.data.suggestions || []);
    } catch (err) {
      console.error("❌ Error loading profile suggestions:", err);
      setProfileSuggestions([]);
    } finally {
      setProfileSuggestionsLoading(false);
    }
  };

  // Search TMDB movies
  const performSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    try {
      console.log("🔍 Searching for:", query);
      const response = await api.get("/search-movies", {
        params: { query }
      });
      
      console.log("✅ Found movies:", response.data.movies?.length || 0);
      setSearchResults(response.data.movies || []);
    } catch (err) {
      console.error("❌ Search error:", err);
      setError(`Search failed: ${err.message}`);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Add movie to taste
  const handleAddMovie = async (movie) => {
    setLoading(true);
    try {
      console.log("➕ Adding movie:", movie.title);
      
      // Get full movie details from backend
      const detailsResponse = await api.get(`/movie-details/${movie.id || movie.tmdb_id}`);
      const fullDetails = detailsResponse.data;
      
      const movieData = {
        tmdb_id: movie.id || movie.tmdb_id,
        title: movie.title,
        poster_path: movie.poster_path,
        year: movie.year || movie.release_date?.split("-")[0],
        overview: movie.overview,
        genres: movie.genre_ids || [],
        genre_names: fullDetails.genre_names || [],
        directors: fullDetails.directors || [],
        cast: fullDetails.cast || [],
        vote_average: movie.vote_average || 0,
        popularity: movie.popularity || 0,
        release_date: movie.release_date
      };

      const addResponse = await api.post("/taste/add-movie", movieData);
      console.log("✅ Movie added successfully");

      // Reload movies
      await loadMyTasteMovies();
      setSearchQuery("");
      setSearchResults([]);
      setError("");
      // Auto-refresh profile suggestions
      setSelectedForSuggestions(null);
      setSimilarMovies([]);
    } catch (err) {
      console.error("❌ Error adding movie:", err);
      setError(err.response?.data?.message || "Failed to add movie");
    } finally {
      setLoading(false);
    }
  };

  // Remove movie from taste
  const handleRemoveMovie = async (tmdb_id) => {
    if (!window.confirm("Remove this movie from your taste?")) return;

    try {
      await api.delete(`/taste/remove-movie/${tmdb_id}`);
      loadMyTasteMovies();
    } catch (err) {
      setError("Failed to remove movie");
    }
  };

  // Fetch smart suggestions when user selects a movie
  const fetchSmartSuggestions = async (movie) => {
    setSelectedForSuggestions(movie);
    setSuggestionsLoading(true);
    setSelectedSuggestions([]);
    
    try {
      console.log("🧠 Fetching smart suggestions for:", movie.title);
      const response = await api.get(`/smart-suggestions/${movie.id || movie.tmdb_id}`);
      
      console.log("✅ Got suggestions:", response.data.suggestions?.length || 0);
      setSimilarMovies(response.data.suggestions || []);
    } catch (err) {
      console.error("❌ Error fetching suggestions:", err);
      setSimilarMovies([]);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Toggle suggestion selection
  const toggleSuggestionSelection = (movie) => {
    const isSelected = selectedSuggestions.some(m => m.id === movie.id);
    
    if (isSelected) {
      setSelectedSuggestions(selectedSuggestions.filter(m => m.id !== movie.id));
    } else {
      setSelectedSuggestions([...selectedSuggestions, movie]);
    }
  };

  // Add selected suggestion movies to taste
  const addSelectedSuggestions = async () => {
    if (selectedSuggestions.length === 0) return;

    setLoading(true);
    try {
      for (const movie of selectedSuggestions) {
        const detailsResponse = await api.get(`/movie-details/${movie.id}`);
        const fullDetails = detailsResponse.data;

        const movieData = {
          tmdb_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          year: movie.year || movie.release_date?.split("-")[0],
          overview: movie.overview,
          genres: movie.genre_ids || [],
          genre_names: fullDetails.genre_names || [],
          directors: fullDetails.directors || [],
          cast: fullDetails.cast || [],
          vote_average: movie.vote_average || 0,
          popularity: movie.popularity || 0,
          release_date: movie.release_date
        };

        await api.post("/taste/add-movie", movieData);
      }

      console.log("✅ Added", selectedSuggestions.length, "movies from suggestions");
      await loadMyTasteMovies();
      setSelectedSuggestions([]);
      setSelectedForSuggestions(null);
      setSimilarMovies([]);
      // Auto-refresh profile suggestions for updated taste
      setTimeout(() => loadProfileSuggestions(), 300);
    } catch (err) {
      console.error("Error adding suggestions:", err);
      setError("Failed to add some movies");
    } finally {
      setLoading(false);
    }
  };

  // Calculate match with friend
  const handleShowMatch = async (friend) => {
    setSelectedFriend(friend);
    setLoading(true);
    try {
      const response = await api.get(`/taste/match/${friend.id}`);
      setMatchResult(response.data);
      setView("matchResult");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to calculate match");
      setLoading(false);
    }
  };

  // MAIN VIEW - Smart Dashboard
  if (view === "main") {
    return (
      <div className="taste-profile-container">
        {/* Header with Add Movie Button */}
        <div className="dashboard-header">
          <div>
            <h1>🎬 Movie Matcher</h1>
            <p>Your personal taste profile</p>
          </div>
          <button onClick={() => setView("addMovie")} className="btn-primary btn-add-movie">
            Add Movie +
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        {/* Movie Taste Section */}
        <div className="movie-taste-section">
          <div className="section-header">
            <h2>🎥 Your Taste</h2>
            <span className="movie-count">{myMovies.length} movies</span>
          </div>

          {myMovies.length === 0 ? (
            <div className="empty-carousel">
              <p>✨ Start adding movies to build your taste profile</p>
              <button onClick={() => setView("addMovie")} className="btn-secondary">
                Add Your First Movie
              </button>
            </div>
          ) : (
            <div className="movie-carousel">
              <div className="carousel-track">
                {myMovies.map((movie) => (
                  <div key={movie.tmdb_id} className="carousel-item">
                    <img
                      src={
                        movie.poster_path
                          ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                          : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='240'%3E%3Crect fill='%23374151' width='160' height='240'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='%239ca3af'%3ENo Poster%3C/text%3E%3C/svg%3E"
                      }
                      alt={movie.title}
                      className="carousel-poster"
                      onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='240'%3E%3Crect fill='%23374151' width='160' height='240'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='%239ca3af'%3ENo Poster%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    <div className="carousel-overlay">
                      <button
                        onClick={() => handleRemoveMovie(movie.tmdb_id)}
                        className="carousel-btn-remove"
                        title="Remove from taste"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Friends Section */}
        <div className="friends-section">
          <div className="section-header">
            <h2>👥 Friends</h2>
            <span className="friend-count">{friends.length}</span>
          </div>

          {friends.length === 0 ? (
            <div className="empty-friends">
              <p>📭 No friends yet. Add friends to compare movie tastes!</p>
            </div>
          ) : (
            <div className="friends-carousel">
              <div className="friends-track">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="friend-avatar-card"
                    onClick={() => handleShowMatch(friend)}
                  >
                    <div className="avatar">
                      {friend.profilePicture ? (
                        <img src={friend.profilePicture} alt={friend.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <p className="friend-name">{friend.name}</p>
                    <button className="btn-match" disabled={myMovies.length === 0}>
                      {loading ? "..." : "Match"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ADD MOVIE VIEW - Smart Version with Suggestions
  if (view === "addMovie") {
    return (
      <div className="taste-profile-container">
        <div className="taste-header">
          <h1>Build Your Taste</h1>
          <p>Add movies to define your unique taste profile</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        {/* Search and Suggestions Wrapper */}
        <div className="search-suggestions-wrapper">
          {/* Step 1: Search Bar */}
          <div className="search-section">
            <input
              type="text"
              placeholder="Add a movie you love 🔍"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input search-input-large"
              autoFocus
            />
            {searchQuery.length > 0 && searching && <span className="search-hint">🔄 Searching...</span>}
          </div>

          {searchQuery.length > 0 && searching && <p className="loading">🔄 Searching...</p>}
          
          {searchQuery.length > 0 && !searching && searchResults.length === 0 && (
            <p className="no-results">📭 No movies found for "{searchQuery}"</p>
          )}

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && !selectedForSuggestions && (
            <div className="search-dropdown">
              <div className="dropdown-header">
                <span>Search Results ({searchResults.length})</span>
                <button
                  onClick={() => {
                    setSearchResults([]);
                    setSearchQuery("");
                  }}
                  className="btn-close-dropdown"
                >
                  ✕
                </button>
              </div>
              <div className="dropdown-results">
                {searchResults.map((movie) => (
                  <div key={movie.id} className="dropdown-movie-item">
                    <img
                      src={
                        movie.poster
                          ? movie.poster
                          : movie.poster_path
                          ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                          : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='180'%3E%3Crect fill='%23374151' width='120' height='180'/%3E%3C/svg%3E"
                      }
                      alt={movie.title}
                      onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='180'%3E%3Crect fill='%23374151' width='120' height='180'/%3E%3C/svg%3E";
                      }}
                    />
                    <div className="dropdown-movie-info">
                      <p className="dropdown-movie-title">{movie.title}</p>
                      <p className="dropdown-movie-year">{movie.year}</p>
                      <div className="dropdown-movie-actions">
                        <button
                          onClick={() => handleAddMovie(movie)}
                          disabled={loading || myMovies.some(m => m.tmdb_id === (movie.id || movie.tmdb_id))}
                          className="btn-add btn-xs"
                          title="Add to taste"
                        >
                          {myMovies.some(m => m.tmdb_id === (movie.id || movie.tmdb_id)) ? "✓" : "➕"}
                        </button>
                        <button
                          onClick={() => fetchSmartSuggestions(movie)}
                          className="btn-suggestions btn-xs"
                          title="Get similar recommendations"
                        >
                          🧠
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Smart Suggestions - Positioned Overlay */}
          {selectedForSuggestions && (
            <div className="suggestions-overlay">
              <div className="suggestions-section">
                <div className="suggestions-header">
                  <h3>
                    💡 
                    {selectedForSuggestions.id === "profile" 
                      ? <>Suggestions for <strong>Your Taste</strong></>
                      : <>Because you liked <strong>{selectedForSuggestions.title}</strong></>
                    }
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedForSuggestions(null);
                      setSimilarMovies([]);
                      setSelectedSuggestions([]);
                    }}
                    className="btn-close"
                  >
                    ✕
                  </button>
                </div>

                {suggestionsLoading && <p className="loading">🔍 Finding similar movies...</p>}

                {!suggestionsLoading && similarMovies.length === 0 && (
                  <p className="no-results">No suggestions found</p>
                )}

                {!suggestionsLoading && similarMovies.length > 0 && (
                  <>
                    <div className="suggestions-carousel">
                      <div className="carousel-track">
                        {similarMovies.map((movie) => {
                          const isSelected = selectedSuggestions.some(m => m.id === movie.id);
                          return (
                            <div
                              key={movie.id}
                              className={`suggestion-item ${isSelected ? "selected" : ""}`}
                              onClick={() => toggleSuggestionSelection(movie)}
                              title={`${movie.similarityScore}% match`}
                            >
                              <img
                                src={
                                  movie.poster_path
                                    ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                                    : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='210'%3E%3Crect fill='%23374151' width='140' height='210'/%3E%3C/svg%3E"
                                }
                                alt={movie.title}
                                onError={(e) => {
                                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='210'%3E%3Crect fill='%23374151' width='140' height='210'/%3E%3C/svg%3E";
                                }}
                              />
                              {movie.similarityScore && (
                                <div className="similarity-badge">{movie.similarityScore}%</div>
                              )}
                              {isSelected && <div className="selection-badge">✓</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="suggestions-actions">
                      <p className="selection-count">
                        {selectedSuggestions.length} selected
                      </p>
                      <button
                        onClick={addSelectedSuggestions}
                        disabled={selectedSuggestions.length === 0 || loading}
                        className="btn-primary"
                      >
                        {loading ? "Adding..." : `➕ Add ${selectedSuggestions.length} Movies`}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setView("main");
            setSearchQuery("");
            setSearchResults([]);
            setSelectedForSuggestions(null);
            setSimilarMovies([]);
            setSelectedSuggestions([]);
          }}
          className="btn-secondary btn-large"
          style={{ marginTop: "20px" }}
        >
          ← Back to Main
        </button>
      </div>
    );
  }

  // MATCH RESULT VIEW
  if (view === "matchResult" && matchResult && selectedFriend) {
    return (
      <div className="taste-profile-container">
        <div className="taste-header">
          <h1>🎯 Match with {selectedFriend.name}</h1>
          <p>Movie taste compatibility</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="match-result">
          <div className="match-percentage">
            <div className="percentage-circle">
              <div className="percentage-value">{matchResult.matchPercentage}%</div>
              <div className="percentage-label">Match</div>
            </div>
            <div className="match-info">
              <p>You have <strong>{matchResult.currentUserMovieCount}</strong> taste movies</p>
              <p>{selectedFriend.name} has <strong>{matchResult.friendMovieCount}</strong> taste movies</p>
            </div>
          </div>

          {matchResult.similarMoviesCount > 0 && (
            <div className="similar-section">
              <h3>Similar Movies in Your Taste ({matchResult.similarMoviesCount})</h3>
              <div className="similar-list">
                {matchResult.similarMovies?.map((pair, idx) => (
                  <div key={idx} className="similar-pair">
                    <div className="movie-pair">
                      <div className="movie">
                        <img
                          src={
                            pair.movie1.poster_path
                              ? `https://image.tmdb.org/t/p/w200${pair.movie1.poster_path}`
                              : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='225'%3E%3Crect fill='%23374151' width='150' height='225'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='%239ca3af'%3ENo Poster%3C/text%3E%3C/svg%3E"
                          }
                          alt={pair.movie1.title}
                          onError={(e) => {
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='225'%3E%3Crect fill='%23374151' width='150' height='225'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='%239ca3af'%3ENo Poster%3C/text%3E%3C/svg%3E";
                          }}
                        />
                        <p>{pair.movie1.title}</p>
                      </div>
                      <div className="match-text">{pair.type}</div>
                      <div className="movie">
                        <img
                          src={
                            pair.movie2.poster_path
                              ? `https://image.tmdb.org/t/p/w200${pair.movie2.poster_path}`
                              : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='225'%3E%3Crect fill='%23374151' width='150' height='225'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='%239ca3af'%3ENo Poster%3C/text%3E%3C/svg%3E"
                          }
                          alt={pair.movie2.title}
                          onError={(e) => {
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='225'%3E%3Crect fill='%23374151' width='150' height='225'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='%239ca3af'%3ENo Poster%3C/text%3E%3C/svg%3E";
                          }}
                        />
                        <p>{pair.movie2.title}</p>
                      </div>
                    </div>
                    <p className="reason">{pair.matchReason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="result-actions">
            <button
              onClick={() => setView("main")}
              className="btn-secondary btn-large"
            >
              Back to Friends
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default MovieMatcher;
