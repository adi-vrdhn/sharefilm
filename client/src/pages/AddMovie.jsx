import React, { useEffect, useState } from "react";
import api from "../api/axios";

const AddMovie = () => {
  const [showForm, setShowForm] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendSearch, setFriendSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [warningFriend, setWarningFriend] = useState(null);
  const [pendingMovie, setPendingMovie] = useState(null);

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

  // Load Google AdSense when component mounts
  useEffect(() => {
    if (typeof window !== "undefined" && window.adsbygoogle) {
      try {
        window.adsbygoogle.push({});
        console.log("AdSense loaded on Add Movie page");
      } catch (error) {
        console.log("AdSense is loading...", error);
      }
    }
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
    // Ensure poster is a full URL
    const posterUrl = movie.poster ? 
      (movie.poster.startsWith('http') ? movie.poster : `https://image.tmdb.org/t/p/w500${movie.poster}`)
      : null;
    
    setSelected({
      ...movie,
      poster: posterUrl
    });
    setQuery(movie.title);
    setResults([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("");
    if (!selected || selectedFriends.length === 0) {
      setStatus("Select a movie and at least one friend.");
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;
    
    for (const friendName of selectedFriends) {
      try {
        await api.post("/addMovieForFriend", { movie: selected, friend: friendName });
        successCount++;
      } catch (error) {
        // Check if user has already watched this movie
        if (error.response?.status === 409 && error.response?.data?.message === "already_watched") {
          setWarningMessage(error.response.data.warning);
          setWarningFriend(friendName);
          setPendingMovie(selected);
          setShowWarningPopup(true);
          setLoading(false);
          return; // Stop and show warning
        } else {
          failCount++;
        }
      }
    }
    
    setLoading(false);
    if (successCount > 0) {
      setStatus(`Movie sent to ${successCount} friend${successCount > 1 ? 's' : ''}!`);
      setSelected(null);
      setQuery("");
      setSelectedFriends([]);
    }
    if (failCount > 0) {
      setStatus(prev => prev + ` Failed to send to ${failCount} friend${failCount > 1 ? 's' : ''}.`);
    }
  };

  const closeWarningPopup = () => {
    setShowWarningPopup(false);
    setWarningMessage("");
    setWarningFriend(null);
    setPendingMovie(null);
  };

  const handleStillSend = async () => {
    setShowWarningPopup(false);
    setLoading(true);
    
    try {
      await api.post("/addMovieForFriend", { 
        movie: pendingMovie, 
        friend: warningFriend,
        force: true // Override the warning
      });
      
      // Remove the friend we just sent to from selectedFriends
      const remainingFriends = selectedFriends.filter(f => f !== warningFriend);
      setSelectedFriends(remainingFriends);
      
      // Continue with remaining friends if any
      if (remainingFriends.length > 0) {
        setStatus(`Sent! Continuing with ${remainingFriends.length} more...`);
        // Re-trigger submit for remaining friends
        setTimeout(() => {
          handleSubmitRest(remainingFriends);
        }, 100);
      } else {
        setStatus("Movie sent!");
        setSelected(null);
        setQuery("");
        setSelectedFriends([]);
      }
    } catch (error) {
      setStatus("Failed to send movie.");
    } finally {
      setLoading(false);
      setWarningFriend(null);
      setPendingMovie(null);
    }
  };

  const handleSubmitRest = async (friendsList) => {
    setLoading(true);
    let successCount = 1; // Already sent to 1 (the warned friend)
    let failCount = 0;
    
    for (const friendName of friendsList) {
      try {
        await api.post("/addMovieForFriend", { movie: pendingMovie, friend: friendName });
        successCount++;
      } catch (error) {
        if (error.response?.status === 409 && error.response?.data?.message === "already_watched") {
          setWarningMessage(error.response.data.warning);
          setWarningFriend(friendName);
          setShowWarningPopup(true);
          setLoading(false);
          return;
        } else {
          failCount++;
        }
      }
    }
    
    setLoading(false);
    setStatus(`Movie sent to ${successCount} friend${successCount > 1 ? 's' : ''}!`);
    setSelected(null);
    setQuery("");
    setSelectedFriends([]);
    if (failCount > 0) {
      setStatus(prev => prev + ` Failed to send to ${failCount}.`);
    }
  };

  const toggleFriendSelection = (friendName) => {
    setSelectedFriends(prev => {
      if (prev.includes(friendName)) {
        return prev.filter(f => f !== friendName);
      } else {
        return [...prev, friendName];
      }
    });
  };

  return (
    <div className="container">
      <h1>Add a movie for a friend</h1>
      <p className="helper-text">
        Share a movie recommendation with your friends.
      </p>

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
                  {results.map((movie) => {
                    const posterUrl = movie.poster ? 
                      (movie.poster.startsWith('http') ? movie.poster : `https://image.tmdb.org/t/p/w500${movie.poster}`)
                      : null;
                    
                    return (
                      <button
                        type="button"
                        className="autocomplete-item"
                        key={movie.tmdb_id}
                        onClick={() => handleSelect(movie)}
                      >
                        {posterUrl && (
                          <img src={posterUrl} alt={movie.title} className="autocomplete-poster" />
                        )}
                        <div className="autocomplete-info">
                          <div className="autocomplete-title">{movie.title}</div>
                          {movie.year && <div className="autocomplete-year">{movie.year}</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Google AdSense Ad Space */}
            <div style={{
              margin: "30px 0",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "280px"
            }}>
              <ins className="adsbygoogle"
                style={{
                  display: "block",
                  textAlign: "center"
                }}
                data-ad-layout="in-article"
                data-ad-format="fluid"
                data-ad-client="ca-pub-6890987360770257"
                data-ad-slot="1234567890"></ins>
            </div>

            <div className="form-row">
              <label>Select Friends ({selectedFriends.length} selected)</label>
              {friends.length > 0 ? (
                <>
                  <input
                    className="input"
                    type="text"
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    placeholder="Search friends..."
                    style={{ marginBottom: "12px" }}
                  />
                  <div className="friends-checkbox-list">
                    {friendSearch.length >= 2
                      ? // Show matching friends first, then others
                        [
                          ...friends.filter(f => f.name.toLowerCase().includes(friendSearch.toLowerCase())),
                          ...friends.filter(f => !f.name.toLowerCase().includes(friendSearch.toLowerCase()))
                        ].map((f) => (
                          <label key={f.id} className="friend-checkbox-item">
                            <input
                              type="checkbox"
                              checked={selectedFriends.includes(f.name)}
                              onChange={() => toggleFriendSelection(f.name)}
                            />
                            <span>{f.name}</span>
                          </label>
                        ))
                      : // Show all friends if search less than 2 characters
                        friends.map((f) => (
                          <label key={f.id} className="friend-checkbox-item">
                            <input
                              type="checkbox"
                              checked={selectedFriends.includes(f.name)}
                              onChange={() => toggleFriendSelection(f.name)}
                            />
                            <span>{f.name}</span>
                          </label>
                        ))
                    }
                  </div>
                </>
              ) : (
                <p className="helper-text">No friends found. Add some friends first!</p>
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
              <button className="secondary action-btn" onClick={closeWarningPopup}>
                Cancel
              </button>
              <button className="primary" onClick={handleStillSend}>
                Still Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddMovie;
