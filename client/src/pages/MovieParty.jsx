import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import "../styles/movieparty.css";

const MovieParty = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [movieResults, setMovieResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [partyStarted, setPartyStarted] = useState(false);
  const [votes, setVotes] = useState({});
  const [hasVoted, setHasVoted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [partyId, setPartyId] = useState(null);
  const [partyData, setPartyData] = useState(null);
  const [joinPartyId, setJoinPartyId] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchFriends();
    loadPopularMovies();
  }, []);

  // Poll for party updates when party is active
  useEffect(() => {
    if (!partyId || !partyStarted) return;

    const pollParty = async () => {
      try {
        const response = await API.get(`/getParty/${partyId}`);
        setPartyData(response.data);
        // Update local vote counts from server data
        const voteCount = {};
        Object.keys(response.data.votes || {}).forEach((movieId) => {
          voteCount[movieId] = response.data.votes[movieId]?.length || 0;
        });
        setVotes(voteCount);
        
        // Check if current user has voted
        const userId = user.id;
        const userHasVoted = Object.values(response.data.votes || {}).some(
          (voters) => voters && voters.includes(userId)
        );
        setHasVoted(userHasVoted);
      } catch (error) {
        console.error("Error polling party:", error);
      }
    };

    pollParty(); // Initial fetch
    const interval = setInterval(pollParty, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [partyId, partyStarted]);

  const fetchFriends = async () => {
    try {
      const response = await API.get("/getFriends");
      setFriends(response.data);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const loadPopularMovies = async () => {
    try {
      setLoading(true);
      const response = await API.get("/popularMovies");
      setMovieResults(response.data || []);
    } catch (error) {
      console.error("Error loading popular movies:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchMovies = async () => {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      const response = await API.get(`/searchMovie?q=${searchQuery}`);
      setMovieResults(response.data || []);
    } catch (error) {
      console.error("Error searching movies:", error);
      alert("Error searching movies. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleFriend = (friendId) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const addMovieToParty = (movie) => {
    const exists = selectedMovies.find((m) => m.tmdb_id === movie.tmdb_id);
    if (!exists) {
      setSelectedMovies((prev) => [...prev, movie]);
      setVotes((prev) => ({ ...prev, [movie.tmdb_id]: 0 }));
    }
  };

  const removeMovie = (movieId) => {
    setSelectedMovies((prev) => prev.filter((m) => m.tmdb_id !== movieId));
    setVotes((prev) => {
      const newVotes = { ...prev };
      delete newVotes[movieId];
      return newVotes;
    });
  };

  const startParty = async () => {
    if (selectedFriends.length === 0 || selectedMovies.length === 0) {
      alert("Select at least 1 friend and 1 movie to start the party!");
      return;
    }

    try {
      const response = await API.post("/createSharedParty", {
        friendIds: selectedFriends,
        movies: selectedMovies,
      });
      
      setPartyId(response.data.partyId);
      setPartyData(response.data.party);
      setPartyStarted(true);
      alert(`Party started! Party ID: ${response.data.partyId}\n${selectedFriends.length} friends invited.`);
    } catch (error) {
      console.error("Error starting party:", error);
      alert("Error starting party. Please try again.");
    }
  };

  const voteForMovie = async (movieId) => {
    if (hasVoted) {
      alert("You've already voted!");
      return;
    }
    
    try {
      await API.post("/voteInParty", {
        partyId: partyId,
        movieId: movieId,
      });
      setHasVoted(true);
      // The polling will update the vote counts automatically
    } catch (error) {
      console.error("Error voting:", error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert("Error submitting vote");
      }
    }
  };

  const resetParty = async () => {
    if (partyId) {
      try {
        await API.post(`/endParty/${partyId}`);
      } catch (error) {
        console.error("Error ending party:", error);
      }
    }
    
    setPartyStarted(false);
    setSelectedFriends([]);
    setSelectedMovies([]);
    setVotes({});
    setHasVoted(false);
    setSearchQuery("");
    setPartyId(null);
    setPartyData(null);
    setJoinPartyId("");
    loadPopularMovies();
  };

  const joinParty = async () => {
    if (!joinPartyId.trim()) {
      alert("Please enter a Party ID");
      return;
    }

    try {
      const response = await API.get(`/getParty/${joinPartyId.trim()}`);
      setPartyData(response.data);
      setPartyId(joinPartyId.trim());
      setSelectedMovies(response.data.movies);
      setPartyStarted(true);
      
      // Set initial vote counts
      const voteCount = {};
      Object.keys(response.data.votes || {}).forEach((movieId) => {
        voteCount[movieId] = response.data.votes[movieId]?.length || 0;
      });
      setVotes(voteCount);
      
      // Check if user has voted
      const userId = user.id;
      const userHasVoted = Object.values(response.data.votes || {}).some(
        (voters) => voters && voters.includes(userId)
      );
      setHasVoted(userHasVoted);
    } catch (error) {
      console.error("Error joining party:", error);
      alert("Party not found or error loading party");
    }
  };

  const showMovieDetails = async (movie) => {
    try {
      setSelectedMovie(movie);
      const response = await API.get(`/movieDetails/${movie.tmdb_id}`);
      setMovieDetails(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching movie details:", error);
      alert("Failed to load movie details");
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedMovie(null);
    setMovieDetails(null);
  };

  if (partyStarted) {
    const sortedMovies = [...selectedMovies].sort(
      (a, b) => (votes[b.tmdb_id] || 0) - (votes[a.tmdb_id] || 0)
    );
    const winner = sortedMovies[0];
    const isHost = partyData?.hostId === user.id;

    return (
      <div className="movie-party-page">
        <div className="party-active">
          <div className="party-header">
            <h2>🎬 Movie Party Active</h2>
            {isHost && (
              <button className="btn-secondary" onClick={resetParty}>
                End Party
              </button>
            )}
          </div>

          <div className="party-info">
            <p>
              <strong>Host:</strong> {partyData?.hostName || user.name}
            </p>
            <p>
              <strong>Party ID:</strong> <code>{partyId}</code>
            </p>
            {isHost && (
              <p>
                <strong>Friends Invited:</strong> {selectedFriends.length}
              </p>
            )}
            {hasVoted && (
              <p className="voted-badge">✅ You've voted!</p>
            )}
          </div>

          <div className="voting-section">
            <h3>Vote for Your Favorite Movie</h3>
            <div className="movies-grid">
              {sortedMovies.map((movie) => (
                <div
                  key={movie.tmdb_id}
                  className={`movie-vote-card ${
                    movie.tmdb_id === winner?.tmdb_id && votes[movie.tmdb_id] > 0
                      ? "winner"
                      : ""
                  }`}
                >
                  <div 
                    className="movie-poster-section"
                    onClick={() => showMovieDetails(movie)}
                  >
                    <img
                      src={movie.poster || "https://via.placeholder.com/200x300"}
                      alt={movie.title}
                    />
                    <div className="details-overlay">ℹ️ Details</div>
                  </div>
                  <h4 onClick={() => showMovieDetails(movie)} style={{cursor: 'pointer'}}>{movie.title}</h4>
                  <p className="vote-count">
                    👍 {votes[movie.tmdb_id] || 0} vote{votes[movie.tmdb_id] !== 1 ? "s" : ""}
                  </p>
                  {movie.tmdb_id === winner?.tmdb_id && votes[movie.tmdb_id] > 0 && (
                    <div className="winner-badge">🏆 Leading</div>
                  )}
                  {!hasVoted && (
                    <button 
                      className="vote-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        voteForMovie(movie.tmdb_id);
                      }}
                    >
                      Vote
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Movie Details Modal */}
        {showDetailsModal && movieDetails && (
          <div className="modal-overlay" onClick={closeDetailsModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={closeDetailsModal}>×</button>
              {movieDetails.backdrop && (
                <div 
                  className="modal-backdrop"
                  style={{backgroundImage: `url(${movieDetails.backdrop})`}}
                />
              )}
              <div className="modal-body">
                <div className="modal-poster">
                  <img src={movieDetails.poster || "https://via.placeholder.com/300x450"} alt={movieDetails.title} />
                </div>
                <div className="modal-info">
                  <h2>{movieDetails.title}</h2>
                  <div className="modal-meta">
                    <span className="year">{movieDetails.year}</span>
                    {movieDetails.runtime > 0 && (
                      <span className="runtime">{movieDetails.runtime} min</span>
                    )}
                    {movieDetails.rating > 0 && (
                      <span className="rating">⭐ {movieDetails.rating.toFixed(1)}/10</span>
                    )}
                  </div>
                  {movieDetails.genres && (
                    <p className="genres"><strong>Genres:</strong> {movieDetails.genres}</p>
                  )}
                  <p className="overview">{movieDetails.overview}</p>
                  {!hasVoted && (
                    <button 
                      className="btn-primary modal-vote-btn"
                      onClick={() => {
                        voteForMovie(selectedMovie.tmdb_id);
                        closeDetailsModal();
                      }}
                    >
                      Vote for this Movie
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="movie-party-page">
      <div className="party-container">
        <div className="party-header">
          <h1>🎬 Movie Party</h1>
          <p className="subtitle">Create a party, invite friends, and vote on movies!</p>
        </div>

        {/* Join Party Section */}
        <div className="form-section join-party-section">
          <h3>Join an Existing Party</h3>
          <div className="join-party-box">
            <input
              type="text"
              placeholder="Enter Party ID..."
              value={joinPartyId}
              onChange={(e) => setJoinPartyId(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && joinParty()}
            />
            <button
              className="btn-secondary"
              onClick={joinParty}
              disabled={!joinPartyId.trim()}
            >
              Join Party
            </button>
          </div>
          <p className="helper-text">OR create a new party below</p>
        </div>

        {/* Friends Selection */}
        <div className="form-section">
          <h3>1. Invite Friends</h3>
          {friends.length === 0 ? (
            <p className="no-data">No friends to invite. Add friends first!</p>
          ) : (
            <div className="friends-list">
              {friends.map((friend) => (
                <label key={friend.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedFriends.includes(friend.id)}
                    onChange={() => toggleFriend(friend.id)}
                  />
                  {friend.name}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Movie Selection */}
        <div className="form-section">
          <h3>2. Add Movies</h3>
          <div className="movie-selection-header">
            <p className="helper-text">
              {showSearch ? "Search for specific movies" : "Popular movies - click to add"}
            </p>
            <button
              className="btn-toggle"
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) {
                  setSearchQuery("");
                  loadPopularMovies();
                }
              }}
            >
              {showSearch ? "Show Popular" : "Search Movies"}
            </button>
          </div>

          {showSearch && (
            <div className="search-box">
              <input
                type="text"
                placeholder="Search for a movie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchMovies()}
              />
              <button
                className="btn-secondary"
                onClick={searchMovies}
                disabled={loading || !searchQuery.trim()}
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <p>Loading movies...</p>
            </div>
          ) : movieResults.length > 0 ? (
            <div className="search-results">
              {movieResults.map((movie) => (
                <div
                  key={movie.tmdb_id}
                  className="search-result-item"
                  onClick={() => addMovieToParty(movie)}
                >
                  <img
                    src={movie.poster || "https://via.placeholder.com/50x75"}
                    alt={movie.title}
                  />
                  <div className="result-info">
                    <p className="title">{movie.title}</p>
                    <p className="year">{movie.year}</p>
                  </div>
                  <button className="add-btn">+</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>No movies found. Try a different search.</p>
            </div>
          )}
          {selectedMovies.length > 0 && (
            <div className="selected-movies">
              <h4>Selected Movies:</h4>
              <div className="movie-chips">
                {selectedMovies.map((movie) => (
                  <div key={movie.tmdb_id} className="movie-chip">
                    <img src={movie.poster} alt={movie.title} />
                    <span>{movie.title}</span>
                    <button onClick={() => removeMovie(movie.tmdb_id)}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Start Party Button */}
        <div className="form-actions">
          <button
            className="btn-primary btn-large"
            onClick={startParty}
            disabled={selectedFriends.length === 0 || selectedMovies.length === 0}
          >
            🎉 Start Party
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieParty;
