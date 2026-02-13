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
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [partyStarted, setPartyStarted] = useState(false);
  const [votes, setVotes] = useState({});
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await API.get("/getFriends");
      setFriends(response.data);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const searchMovies = async () => {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      const response = await API.get(`/searchMovie?q=${searchQuery}`);
      setSearchResults(response.data || []);
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
    const exists = selectedMovies.find((m) => m.id === movie.id);
    if (!exists) {
      setSelectedMovies((prev) => [...prev, movie]);
      setVotes((prev) => ({ ...prev, [movie.id]: 0 }));
    }
  };

  const removeMovie = (movieId) => {
    setSelectedMovies((prev) => prev.filter((m) => m.id !== movieId));
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

    // Send notifications to selected friends
    try {
      for (const friendId of selectedFriends) {
        await API.post("/addNotification", {
          userId: friendId,
          message: `${user.name} invited you to a Movie Party!`,
          type: "party_invite",
        });
      }
      setPartyStarted(true);
      alert(`Party started! ${selectedFriends.length} friends invited.`);
    } catch (error) {
      console.error("Error sending invites:", error);
      alert("Error starting party");
    }
  };

  const voteForMovie = (movieId) => {
    if (hasVoted) {
      alert("You've already voted!");
      return;
    }
    setVotes((prev) => ({
      ...prev,
      [movieId]: (prev[movieId] || 0) + 1,
    }));
    setHasVoted(true);
  };

  const resetParty = () => {
    setPartyStarted(false);
    setSelectedFriends([]);
    setSelectedMovies([]);
    setVotes({});
    setHasVoted(false);
    setSearchResults([]);
    setSearchQuery("");
  };

  if (partyStarted) {
    const sortedMovies = [...selectedMovies].sort(
      (a, b) => (votes[b.id] || 0) - (votes[a.id] || 0)
    );
    const winner = sortedMovies[0];

    return (
      <div className="movie-party-page">
        <div className="party-active">
          <div className="party-header">
            <h2>🎬 Movie Party Active</h2>
            <button className="btn-secondary" onClick={resetParty}>
              End Party
            </button>
          </div>

          <div className="party-info">
            <p>
              <strong>Host:</strong> {user.name}
            </p>
            <p>
              <strong>Friends Invited:</strong> {selectedFriends.length}
            </p>
            {hasVoted && (
              <p className="voted-badge">✅ You've voted!</p>
            )}
          </div>

          <div className="voting-section">
            <h3>Vote for Your Favorite Movie</h3>
            <div className="movies-grid">
              {sortedMovies.map((movie) => (
                <div
                  key={movie.id}
                  className={`movie-vote-card ${
                    movie.id === winner?.id && votes[movie.id] > 0
                      ? "winner"
                      : ""
                  }`}
                  onClick={() => !hasVoted && voteForMovie(movie.id)}
                >
                  <img
                    src={movie.poster || "https://via.placeholder.com/200x300"}
                    alt={movie.title}
                  />
                  <h4>{movie.title}</h4>
                  <p className="vote-count">
                    👍 {votes[movie.id] || 0} vote{votes[movie.id] !== 1 ? "s" : ""}
                  </p>
                  {movie.id === winner?.id && votes[movie.id] > 0 && (
                    <div className="winner-badge">🏆 Leading</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
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

          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((movie) => (
                <div
                  key={movie.id}
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
          )}

          {searchQuery && !loading && searchResults.length === 0 && (
            <div className="no-results">
              <p>No movies found. Try a different search.</p>
            </div>
          )}

          {selectedMovies.length > 0 && (
            <div className="selected-movies">
              <h4>Selected Movies:</h4>
              <div className="movie-chips">
                {selectedMovies.map((movie) => (
                  <div key={movie.id} className="movie-chip">
                    <img src={movie.poster} alt={movie.title} />
                    <span>{movie.title}</span>
                    <button onClick={() => removeMovie(movie.id)}>×</button>
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
