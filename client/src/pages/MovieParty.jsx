import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import "../styles/movieparty.css";

const MovieParty = () => {
  const { user } = useAuth();
  const [parties, setParties] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [friends, setFriends] = useState([]);
  const [roomCode, setRoomCode] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentParty, setCurrentParty] = useState(null);
  const [votes, setVotes] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch user's friends
  useEffect(() => {
    fetchFriends();
  }, []);

  // Poll for active parties
  useEffect(() => {
    fetchParties();
    const interval = setInterval(fetchParties, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await API.get("/getFriends");
      setFriends(response.data);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const fetchParties = async () => {
    try {
      const response = await API.get("/getParties");
      setParties(response.data);
      if (currentParty) {
        const updated = response.data.find((p) => p.id === currentParty.id);
        if (updated) setCurrentParty(updated);
      }
    } catch (error) {
      console.error("Error fetching parties:", error);
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

  const toggleMovie = (movieId) => {
    setSelectedMovies((prev) =>
      prev.includes(movieId)
        ? prev.filter((id) => id !== movieId)
        : [...prev, movieId]
    );
  };

  const createParty = async () => {
    if (selectedFriends.length === 0 || selectedMovies.length === 0) {
      alert("Select at least 1 friend and 1 movie");
      return;
    }

    setLoading(true);
    try {
      const response = await API.post("/createParty", {
        invitedFriends: selectedFriends,
        movies: selectedMovies,
      });
      setCurrentParty(response.data);
      setShowCreateForm(false);
      setSelectedFriends([]);
      setSelectedMovies([]);
      setSearchResults([]);
      setSearchQuery("");
      fetchParties();
    } catch (error) {
      alert("Error creating party: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const joinParty = async (partyId) => {
    setLoading(true);
    try {
      const response = await API.post(`/joinParty/${partyId}`);
      setCurrentParty(response.data);
      fetchParties();
    } catch (error) {
      alert("Error joining party: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const voteForMovie = async (partyId, movieId) => {
    try {
      const response = await API.post(`/voteMovie`, {
        partyId,
        movieId,
      });
      setVotes((prev) => ({
        ...prev,
        [movieId]: (prev[movieId] || 0) + 1,
      }));
      fetchParties();
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const leaveParty = async () => {
    if (!currentParty) return;
    try {
      await API.post(`/leaveParty/${currentParty.id}`);
      setCurrentParty(null);
      fetchParties();
    } catch (error) {
      console.error("Error leaving party:", error);
    }
  };

  if (currentParty) {
    return (
      <div className="movie-party-page">
        <div className="party-active">
          <div className="party-header">
            <h2>🎬 Movie Party Room #{currentParty.id.slice(0, 6)}</h2>
            <button className="btn-secondary" onClick={leaveParty}>
              Leave Party
            </button>
          </div>

          <div className="party-info">
            <p>
              <strong>Host:</strong> {currentParty.createdBy}
            </p>
            <p>
              <strong>Members:</strong> {currentParty.members?.length || 0}
            </p>
          </div>

          <div className="voting-section">
            <h3>Vote for Your Favorite Movie</h3>
            <div className="movies-grid">
              {currentParty.movies?.map((movie) => (
                <div
                  key={movie.id}
                  className="movie-vote-card"
                  onClick={() => voteForMovie(currentParty.id, movie.id)}
                >
                  <img
                    src={movie.poster || "https://via.placeholder.com/200x300"}
                    alt={movie.title}
                  />
                  <h4>{movie.title}</h4>
                  <p className="vote-count">
                    👍 {currentParty.votes?.[movie.id] || 0} votes
                  </p>
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
        {!showCreateForm ? (
          <>
            <div className="party-header">
              <h1>🎬 Movie Party</h1>
              <button
                className="btn-primary"
                onClick={() => setShowCreateForm(true)}
              >
                + Create Party
              </button>
            </div>

            {parties.length === 0 ? (
              <div className="empty-state">
                <p>No active parties. Create one to get started!</p>
              </div>
            ) : (
              <div className="parties-list">
                <h2>Available Parties</h2>
                {parties.map((party) => (
                  <div key={party.id} className="party-card">
                    <div className="party-details">
                      <h3>Room #{party.id.slice(0, 6)}</h3>
                      <p>Host: {party.createdBy}</p>
                      <p>Members: {party.members?.length || 0}</p>
                      <p>Movies: {party.movies?.length || 0}</p>
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => joinParty(party.id)}
                      disabled={loading}
                    >
                      {loading ? "Joining..." : "Join Party"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="create-party-form">
            <h2>Create a Movie Party</h2>

            {/* Friends Selection */}
            <div className="form-section">
              <h3>1. Invite Friends</h3>
              <div className="friends-list">
                {friends.length === 0 ? (
                  <p className="no-data">No friends to invite</p>
                ) : (
                  friends.map((friend) => (
                    <label key={friend.id} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedFriends.includes(friend.id)}
                        onChange={() => toggleFriend(friend.id)}
                      />
                      {friend.name}
                    </label>
                  ))
                )}
              </div>
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
                      onClick={() => toggleMovie(movie.id)}
                    >
                      <img
                        src={movie.poster || "https://via.placeholder.com/50x75"}
                        alt={movie.title}
                      />
                      <div className="result-info">
                        <p className="title">{movie.title}</p>
                        <p className="year">{movie.year}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedMovies.includes(movie.id)}
                        onChange={() => toggleMovie(movie.id)}
                      />
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
                  <h4>Selected:</h4>
                  {selectedMovies.map((movieId) => {
                    const movie = searchResults.find((m) => m.id === movieId);
                    return (
                      <span key={movieId} className="tag">
                        {movie?.title}
                        <button onClick={() => toggleMovie(movieId)}>×</button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button
                className="btn-primary"
                onClick={createParty}
                disabled={
                  loading ||
                  selectedFriends.length === 0 ||
                  selectedMovies.length === 0
                }
              >
                {loading ? "Creating..." : "Create Party"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setSelectedFriends([]);
                  setSelectedMovies([]);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieParty;
