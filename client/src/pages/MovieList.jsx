import React, { useEffect, useState } from "react";
import api from "../api/axios";
import MovieCard from "../components/MovieCard";

const MovieList = () => {
  const [movies, setMovies] = useState([]);
  const [status, setStatus] = useState("");

  const loadList = async () => {
    try {
      const response = await api.get("/getUserList");
      setMovies(response.data);
    } catch (error) {
      setStatus("Failed to load list");
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/deleteMovie/${id}`);
      setMovies((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      setStatus("Delete failed");
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
      setMovies((prev) => prev.filter((m) => m.id !== item.id));
      setStatus(`${item.movie.title} marked as watched!`);
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus("Failed to mark as watched");
    }
  };

  return (
    <div className="container">
      <h1>My Movie List</h1>
      <p className="helper-text">Movies your friends sent to you.</p>
      {status && <p className="helper-text">{status}</p>}
      <div className="card-grid">
        {movies.map((item) => (
          <MovieCard key={item.id} item={item} onDelete={handleDelete} onWatched={handleWatched} />
        ))}
      </div>
      {movies.length === 0 && <p className="helper-text">No movies yet.</p>}
    </div>
  );
};

export default MovieList;
