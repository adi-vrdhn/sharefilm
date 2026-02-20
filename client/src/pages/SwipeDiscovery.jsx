import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Film, Heart, X, Info } from "lucide-react";
import api from "../api/axios";
import "../styles/swipeDiscovery.css";

const SwipeDiscovery = () => {
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [swipeStats, setSwipeStats] = useState({ watched: 0, nah: 0, want: 0 });
  const [showInfo, setShowInfo] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch from public endpoint that returns popular/trending movies
      const response = await api.get("/movie-details/550"); // Get one movie first
      // In real implementation, we'd have an endpoint that returns multiple movies
      // For now, fetch popular movies from TMDB via the backend
      
      // Using the recommendations endpoint to get candidate movies
      const response2 = await api.get("/recommendations?limit=20");
      const recs = response2.data?.data?.recommendations || [];
      setMovies(recs.slice(0, 15)); // Take 15 movies for swiping
    } catch (err) {
      console.error("Error fetching movies:", err);
      setError("Failed to load movies. Please try again.");
      // Fallback: Create dummy movies for UI testing
      setMovies(createDummyMovies());
    } finally {
      setLoading(false);
    }
  };

  const createDummyMovies = () => [
    {
      id: 1,
      title: "The Shawshank Redemption",
      poster_path: "/posters/shawshank.jpg",
      vote_average: 9.3,
      overview: "Two imprisoned men bond over a number of years...",
      release_date: "1994-10-14",
      recommendationScore: 92,
    },
    {
      id: 2,
      title: "The Godfather",
      poster_path: "/posters/godfather.jpg",
      vote_average: 9.2,
      overview: "The aging patriarch of an organized crime dynasty...",
      release_date: "1972-03-24",
      recommendationScore: 88,
    },
  ];

  const currentMovie = movies[currentIndex];

  const recordSwipe = async (action) => {
    if (!currentMovie) return;

    try {
      // Send swipe action to backend for taste learning
      await api.post("/recommendations/learn", {
        tmdbId: currentMovie.id,
        action, // 'watched', 'want', or 'nah'
        genres: currentMovie.genre_ids || [],
        language: currentMovie.original_language || "en",
      });

      // Update stats
      setSwipeStats((prev) => ({
        ...prev,
        [action]: prev[action] + 1,
      }));
    } catch (err) {
      console.error("Error recording swipe:", err);
    }

    // Move to next movie
    if (currentIndex < movies.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Reload movies
      setCurrentIndex(0);
      fetchMovies();
    }
  };

  const handleDrag = (event, info) => {
    const threshold = 50;
    const swipeDistance = info.offset.x;

    if (swipeDistance > threshold) {
      // Swiped right - watched
      recordSwipe("watched");
    } else if (swipeDistance < -threshold) {
      // Swiped left - nah
      recordSwipe("nah");
    }
  };

  if (loading) {
    return (
      <div className="swipe-discovery-page">
        <div className="swipe-container">
          <div className="loading-card">
            <div className="spinner"></div>
            <p>Loading movies...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="swipe-discovery-page">
        <div className="error-card">
          <p>{error}</p>
          <button onClick={fetchMovies} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="swipe-discovery-page">
        <div className="empty-state">
          <Film size={48} className="empty-icon" />
          <p>No movies to swipe!</p>
          <button onClick={fetchMovies} className="retry-btn">
            Load Movies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="swipe-discovery-page">
      <div className="swipe-header">
        <h1>🎬 What to Watch Next</h1>
        <p>Swipe to discover movies based on your taste</p>
      </div>

      {/* Stats */}
      <div className="swipe-stats">
        <div className="stat-item watched">
          <Heart size={20} />
          <span>{swipeStats.watched} Watched</span>
        </div>
        <div className="stat-item nah">
          <X size={20} />
          <span>{swipeStats.nah} Nope</span>
        </div>
        <div className="stat-item want">
          <Star size={20} />
          <span>{swipeStats.want} Want</span>
        </div>
      </div>

      {/* Swipe Card */}
      <div className="swipe-container" ref={containerRef}>
        <AnimatePresence mode="wait">
          {currentMovie && (
            <motion.div
              key={currentMovie.id}
              className="swipe-card"
              drag="x"
              dragElastic={0.2}
              onDragEnd={handleDrag}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Poster */}
              <div className="card-poster">
                {currentMovie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w342${currentMovie.poster_path}`}
                    alt={currentMovie.title}
                  />
                ) : (
                  <div className="no-poster">
                    <Film size={64} />
                  </div>
                )}

                {/* Overlay Info */}
                <div className="card-overlay">
                  <div className="title-section">
                    <h2>{currentMovie.title}</h2>
                    {currentMovie.release_date && (
                      <span className="year">
                        {new Date(currentMovie.release_date).getFullYear()}
                      </span>
                    )}
                  </div>

                  {currentMovie.vote_average && (
                    <div className="rating">
                      <Star size={20} className="star-icon" />
                      <span>{currentMovie.vote_average.toFixed(1)}</span>
                    </div>
                  )}

                  {currentMovie.recommendationScore && (
                    <div className="match-score">
                      {Math.round(currentMovie.recommendationScore)}% match
                    </div>
                  )}
                </div>
              </div>

              {/* Info Section */}
              {currentMovie.overview && (
                <div className="card-info">
                  <p className="overview">{currentMovie.overview.substring(0, 150)}...</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="swipe-actions">
          <motion.button
            className="action-btn nah-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => recordSwipe("nah")}
            title="Nope (Swipe Left)"
          >
            <X size={24} />
            <span>Nope</span>
          </motion.button>

          <motion.button
            className="action-btn info-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowInfo(!showInfo)}
            title="More Info"
          >
            <Info size={24} />
            <span>Info</span>
          </motion.button>

          <motion.button
            className="action-btn watched-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => recordSwipe("watched")}
            title="Watched (Swipe Right)"
          >
            <Heart size={24} />
            <span>Watched</span>
          </motion.button>
        </div>

        {/* Progress */}
        <div className="swipe-progress">
          <span>
            {currentIndex + 1} / {movies.length}
          </span>
        </div>
      </div>

      {/* Help Text */}
      <div className="swipe-help">
        <p>← Swipe Left to Skip | Swipe Right to Add →</p>
      </div>
    </div>
  );
};

export default SwipeDiscovery;
