import React, { useState, useEffect } from "react";
import { ChevronLeft, Settings } from "lucide-react";
import api from "../api/axios";
import "../styles/nextShow.css";
import NextShowFilters from "../components/NextShowFilters";
import SwipeCardStack from "../components/SwipeCardStack";
import SimilarMoviesSearch from "../components/SimilarMoviesSearch";

const NextShow = () => {
  const [mode, setMode] = useState("filters"); // filters, swiping, similar
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    genres: [],
    languages: [],
    platforms: [],
  });
  const [stats, setStats] = useState({
    watched: 0,
    interested: 0,
    passed: 0,
    swipeCount: 0,
  });
  const [selectedForSimilar, setSelectedForSimilar] = useState(null);

  // Load movies when filters are applied
  const handleFiltersApplied = async (newFilters) => {
    setFilters(newFilters);
    setMode("swiping");
    await fetchMovies(newFilters);
  };

  const fetchMovies = async (appliedFilters) => {
    try {
      setLoading(true);
      const response = await api.get("/api/next-show/movies", {
        params: {
          genres: appliedFilters.genres.join(",") || "any",
          languages: appliedFilters.languages.join(",") || "any",
          platforms: appliedFilters.platforms.join(",") || "any",
          limit: 50,
        },
      });
      setMovies(response.data.data.movies || []);
      setCurrentIndex(0);
    } catch (err) {
      console.error("Error fetching movies:", err);
      // Fallback to recommendations
      try {
        const response = await api.get("/api/recommendations?limit=50");
        setMovies(response.data.data.recommendations || []);
      } catch {
        setMovies([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (action) => {
    const movie = movies[currentIndex];
    if (!movie) return;

    try {
      // Record the swipe action
      await api.post("/api/next-show/record-swipe", {
        tmdbId: movie.id,
        movieTitle: movie.title,
        action, // "watched", "interested", "passed"
        genres: movie.genre_ids || [],
        language: movie.original_language || "en",
        director: movie.director || null,
        cast: movie.cast || [],
        platform: movie.platform || null,
      });

      // Update stats
      setStats((prev) => ({
        ...prev,
        [action]: prev[action] + 1,
        swipeCount: prev.swipeCount + 1,
      }));
    } catch (err) {
      console.error("Error recording swipe:", err);
    }

    // Move to next movie
    moveToNextMovie();
  };

  const moveToNextMovie = () => {
    if (currentIndex < movies.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Reload movies
      setCurrentIndex(0);
      fetchMovies(filters);
    }
  };

  const handleAddToWatchlist = async () => {
    const movie = movies[currentIndex];
    if (!movie) return;

    try {
      await api.post("/api/movies/watchlist", {
        tmdbId: movie.id,
        title: movie.title,
        poster: movie.poster_path,
      });
      handleSwipe("interested");
    } catch (err) {
      console.error("Error adding to watchlist:", err);
    }
  };

  const handleFindSimilar = (movie) => {
    setSelectedForSimilar(movie);
    setMode("similar");
  };

  const handleBackToSwiping = () => {
    setMode("swiping");
    setSelectedForSimilar(null);
  };

  // Render different modes
  if (mode === "filters") {
    return <NextShowFilters onFiltersApplied={handleFiltersApplied} />;
  }

  if (mode === "similar" && selectedForSimilar) {
    return (
      <SimilarMoviesSearch
        baseMovie={selectedForSimilar}
        onBack={handleBackToSwiping}
      />
    );
  }

  return (
    <div className="next-show-container">
      {/* Header */}
      <div className="next-show-header">
        <button
          className="back-btn"
          onClick={() => setMode("filters")}
          aria-label="Back to filters"
        >
          <ChevronLeft size={24} />
        </button>
        <h1>NEXT SHOW</h1>
        <button
          className="settings-btn"
          onClick={() => setMode("filters")}
          aria-label="Adjust filters"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat">
          <span className="label">Watched</span>
          <span className="value">{stats.watched}</span>
        </div>
        <div className="stat">
          <span className="label">Interested</span>
          <span className="value">{stats.interested}</span>
        </div>
        <div className="stat">
          <span className="label">Passed</span>
          <span className="value">{stats.passed}</span>
        </div>
      </div>

      {/* Swipe Cards */}
      {loading ? (
        <div className="loader">Loading movies...</div>
      ) : movies.length > 0 ? (
        <SwipeCardStack
          movies={movies}
          currentIndex={currentIndex}
          onSwipeRight={() => handleSwipe("watched")}
          onSwipeLeft={() => handleSwipe("passed")}
          onSwipeDown={() => handleFindSimilar(movies[currentIndex])}
          onLongPress={handleAddToWatchlist}
        />
      ) : (
        <div className="empty-state">
          <p>No movies found. Try adjusting your filters!</p>
          <button onClick={() => setMode("filters")}>Back to Filters</button>
        </div>
      )}
    </div>
  );
};

export default NextShow;
