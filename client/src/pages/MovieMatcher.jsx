import React, { useState, useEffect } from "react";
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

  // Match Result State
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [matchResult, setMatchResult] = useState(null);

  // Load user's taste movies on mount
  useEffect(() => {
    loadMyTasteMovies();
    loadFriends();
  }, []);

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
      const response = await api.get("/friends/my-friends");
      setFriends(response.data.friends || []);
    } catch (err) {
      console.error("Error loading friends:", err);
    }
  };

  // Search TMDB movies
  const handleSearchMovies = async (query) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get("/search-movies", {
        params: { query }
      });
      setSearchResults(response.data.movies || []);
    } catch (err) {
      console.error("Error searching movies:", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Add movie to taste
  const handleAddMovie = async (movie) => {
    setLoading(true);
    try {
      // Extract only needed fields, fetch full details if needed
      const movieData = {
        tmdb_id: movie.id || movie.tmdb_id,
        title: movie.title,
        poster_path: movie.poster_path,
        year: movie.year || movie.release_date?.split("-")[0],
        overview: movie.overview,
        genres: movie.genre_ids || [],
        genre_names: movie.genre_names || [],
        directors: movie.directors || [],
        cast: movie.cast || [],
        vote_average: movie.vote_average || 0,
        popularity: movie.popularity || 0,
        release_date: movie.release_date
      };

      await api.post("/taste/add-movie", movieData);

      // Reload movies
      loadMyTasteMovies();
      setSearchQuery("");
      setSearchResults([]);
      setError("");
    } catch (err) {
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

  // MAIN VIEW
  if (view === "main") {
    return (
      <div className="taste-profile-container">
        <div className="taste-header">
          <h1>🎬 Movie Taste</h1>
          <p>Define your movie taste and match with friends</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="taste-actions">
          <button onClick={() => setView("addMovie")} className="btn-primary btn-large">
            + Add Your Taste Movies
          </button>
        </div>

        {/* Your Taste Movies */}
        <div className="section">
          <h2>Your Taste ({myMovies.length} movies)</h2>
          {myMovies.length === 0 ? (
            <div className="empty-state">
              <p>No movies added yet. Start by adding movies to define your taste!</p>
            </div>
          ) : (
            <div className="movies-grid">
              {myMovies.map((movie) => (
                <div key={movie.tmdb_id} className="movie-card">
                  <img
                    src={
                      movie.poster_path
                        ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                        : "https://via.placeholder.com/200x300?text=No+Poster"
                    }
                    alt={movie.title}
                  />
                  <div className="movie-overlay">
                    <button
                      onClick={() => handleRemoveMovie(movie.tmdb_id)}
                      className="btn-remove"
                    >
                      ✕ Remove
                    </button>
                  </div>
                  <div className="movie-info">
                    <h4>{movie.title}</h4>
                    <p className="year">{movie.year}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Friends List */}
        <div className="section">
          <h2>Your Friends ({friends.length})</h2>
          {friends.length === 0 ? (
            <div className="empty-state">
              <p>No friends yet. Add some friends to see your movie taste matches!</p>
            </div>
          ) : (
            <div className="friends-list">
              {friends.map((friend) => (
                <div key={friend.id} className="friend-card">
                  <div className="friend-info">
                    <h3>{friend.name}</h3>
                  </div>
                  <button
                    onClick={() => handleShowMatch(friend)}
                    disabled={loading || myMovies.length === 0}
                    className="btn-match"
                  >
                    {loading ? "Loading..." : "See Match"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ADD MOVIE VIEW
  if (view === "addMovie") {
    return (
      <div className="taste-profile-container">
        <div className="taste-header">
          <h1>+ Add Movies to Your Taste</h1>
          <p>Search and add movies that define your taste</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="search-section">
          <input
            type="text"
            placeholder="Search for movies... (e.g., Inception, Avatar)"
            value={searchQuery}
            onChange={(e) => handleSearchMovies(e.target.value)}
            className="search-input"
            autoFocus
          />
        </div>

        {searching && <p className="loading">🔄 Searching...</p>}

        {searchResults.length > 0 && (
          <div className="search-results">
            <h3>Search Results</h3>
            <div className="movies-grid">
              {searchResults.map((movie) => (
                <div key={movie.id} className="search-result-card">
                  <img
                    src={
                      movie.poster
                        ? movie.poster
                        : "https://via.placeholder.com/200x300?text=No+Poster"
                    }
                    alt={movie.title}
                  />
                  <div className="movie-info">
                    <h4>{movie.title}</h4>
                    <p className="year">{movie.year}</p>
                  </div>
                  <button
                    onClick={() => handleAddMovie(movie)}
                    disabled={loading}
                    className="btn-add"
                  >
                    {loading ? "Adding..." : "➕ Add"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setView("main")}
          className="btn-secondary btn-large"
          style={{ marginTop: "20px" }}
        >
          Back to Main
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
                              : "https://via.placeholder.com/150x225?text=No+Poster"
                          }
                          alt={pair.movie1.title}
                        />
                        <p>{pair.movie1.title}</p>
                      </div>
                      <div className="match-text">{pair.type}</div>
                      <div className="movie">
                        <img
                          src={
                            pair.movie2.poster_path
                              ? `https://image.tmdb.org/t/p/w200${pair.movie2.poster_path}`
                              : "https://via.placeholder.com/150x225?text=No+Poster"
                          }
                          alt={pair.movie2.title}
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
