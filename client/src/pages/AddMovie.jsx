import React, { useEffect, useState } from "react";
import api from "../api/axios";

const AddMovie = () => {
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [friend, setFriend] = useState("");
  const [friends, setFriends] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const response = await api.get("/getFriends");
        setFriends(response.data);
      } catch (error) {
        // Silent fail
      }
    };
    loadFriends();
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await api.get(`/searchMovie?q=${encodeURIComponent(query)}`);
        setResults(response.data.slice(0, 6));
      } catch (error) {
        setResults([]);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (movie) => {
    setSelected(movie);
    setQuery(movie.title);
    setResults([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("");
    if (!selected || !friend) {
      setStatus("Select a movie and enter a friend username.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/addMovieForFriend", { movie: selected, friend });
      setStatus("Movie sent!" );
      setSelected(null);
      setQuery("");
      setFriend("");
    } catch (error) {
      // Check if user has already watched this movie
      if (error.response?.status === 409 && error.response?.data?.message === "already_watched") {
        setWarningMessage(error.response.data.warning);
        setShowWarningPopup(true);
      } else {
        setStatus(error.response?.data?.message || "Failed to send movie.");
      }
    } finally {
      setLoading(false);
    }
  };

  const closeWarningPopup = () => {
    setShowWarningPopup(false);
    setWarningMessage("");
  };

  return (
    <div className="container">
      <h1>Add a movie for a friend</h1>
      <p className="helper-text">
        Tap the plus to open the form and share a recommendation.
      </p>
      <button className="plus-button" onClick={() => setShowForm((prev) => !prev)}>
        +
      </button>

      {showForm && (
        <div className="form-card" style={{ marginTop: 20 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-row autocomplete">
              <label>TMDB Search</label>
              <input
                className="input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search for a movie"
              />
              {results.length > 0 && (
                <div className="autocomplete-list">
                  {results.map((movie) => (
                    <div
                      className="autocomplete-item"
                      key={movie.tmdb_id}
                      onClick={() => handleSelect(movie)}
                    >
                      {movie.title} {movie.year ? `(${movie.year})` : ""}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="form-row">
              <label>Friend Username</label>
              {friends.length > 0 ? (
                <select
                  className="input"
                  value={friend}
                  onChange={(event) => setFriend(event.target.value)}
                  required
                >
                  <option value="">-- Select a friend --</option>
                  {friends.map((f) => (
                    <option key={f.id} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="input"
                  value={friend}
                  onChange={(event) => setFriend(event.target.value)}
                  placeholder="Type a username"
                />
              )}
            </div>
            {selected && (
              <div className="form-row">
                <label>Poster Preview</label>
                {selected.poster ? (
                  <img className="poster-preview" src={selected.poster} alt={selected.title} />
                ) : (
                  <p className="helper-text">No poster available.</p>
                )}
              </div>
            )}
            {status && <p className="helper-text">{status}</p>}
            <button className="primary" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Submit"}
            </button>
          </form>
        </div>
      )}

      {/* Warning Popup */}
      {showWarningPopup && (
        <div className="modal-overlay" onClick={closeWarningPopup}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Already Watched</h3>
            </div>
            <div className="modal-body">
              <p>{warningMessage}</p>
            </div>
            <div className="modal-footer">
              <button className="primary" onClick={closeWarningPopup}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddMovie;
