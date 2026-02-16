import React, { useEffect, useState } from "react";
import api from "../api/axios";
import MovieCard from "../components/MovieCard";
import "../styles/movielist.css";

const MovieList = () => {
  const [receivedMovies, setReceivedMovies] = useState([]);
  const [sentMovies, setSentMovies] = useState([]);
  const [status, setStatus] = useState("");
  const [view, setView] = useState("received"); // "received" or "sent"

  const loadReceivedMovies = async () => {
    try {
      const response = await api.get("/getUserList");
      setReceivedMovies(response.data);
    } catch (error) {
      setStatus("Failed to load received movies");
    }
  };

  const loadSentMovies = async () => {
    try {
      const response = await api.get("/getSentMovies");
      setSentMovies(response.data);
    } catch (error) {
      setStatus("Failed to load sent movies");
    }
  };

  useEffect(() => {
    loadReceivedMovies();
    loadSentMovies();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/deleteMovie/${id}`);
      setReceivedMovies((prev) => prev.filter((item) => item.id !== id));
      setStatus("Movie removed from your list");
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus("Delete failed");
    }
  };

  const handleDeleteFromSent = async (id) => {
    try {
      await api.delete(`/deleteFromSentList/${id}`);
      setSentMovies((prev) => prev.filter((item) => item.id !== id));
      setStatus("Movie removed from your sent list");
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus("Delete failed");
    }
  };

  const handleClearAllSent = async () => {
    if (!window.confirm("Are you sure you want to remove ALL sent movies from your list? (They will remain in your friends' lists)")) {
      return;
    }
    try {
      await Promise.all(sentMovies.map(movie => api.delete(`/deleteFromSentList/${movie.id}`)));
      setSentMovies([]);
      setStatus("All sent movies removed from your list");
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus("Clear all failed");
    }
  };

  const handleWatched = async (item) => {
    try {
      // Mark as watched in database
      await api.post("/markMovieWatched", {
        tmdbId: item.movie.tmdbId,
        userMovieId: item.id
      });
      
      // Remove from list
      setReceivedMovies((prev) => prev.filter((m) => m.id !== item.id));
      setStatus(`${item.movie.title} marked as watched!`);
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus("Failed to mark as watched");
    }
  };

  const displayMovies = view === "received" ? receivedMovies : sentMovies;
  const showActions = view === "received"; // Only show delete/watched for received movies

  return (
    <div className="container">
      <div className="movies-header">
        <div>
          <h1>Movie Recommendations</h1>
          <p className="helper-text">
            {view === "received" ? "Movies your friends sent to you." : "Movies you've sent to friends."}
          </p>
        </div>
        <div className="view-toggle">
          <button
            className={`toggle-btn ${view === "received" ? "active" : ""}`}
            onClick={() => setView("received")}
          >
            Received ({receivedMovies.length})
          </button>
          <button
            className={`toggle-btn ${view === "sent" ? "active" : ""}`}
            onClick={() => setView("sent")}
          >
            Sent ({sentMovies.length})
          </button>
        </div>
      </div>

      {status && <p className="helper-text">{status}</p>}

      {view === "sent" && sentMovies.length > 0 && (
        <div className="sent-actions">
          <button 
            className="clear-all-btn"
            onClick={handleClearAllSent}
            title="Remove all sent movies from your list"
          >
            Clear All History
          </button>
        </div>
      )}
      
      <div className="card-grid">
        {displayMovies.map((item) => (
          <MovieCard 
            key={item.id} 
            item={item} 
            onDelete={showActions ? handleDelete : (view === "sent" ? handleDeleteFromSent : null)} 
            onWatched={showActions ? handleWatched : null}
            isSentView={view === "sent"}
          />
        ))}
      </div>
      
      {displayMovies.length === 0 && (
        <p className="helper-text">
          {view === "received" ? "No movies received yet." : "No movies sent yet."}
        </p>
      )}
    </div>
  );
};

export default MovieList;
