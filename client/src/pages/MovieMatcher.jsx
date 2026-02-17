import React, { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "../styles/newMovieMatcher.css";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "pa", name: "Punjabi" },
  { code: "mr", name: "Marathi" },
  { code: "gu", name: "Gujarati" },
  { code: "bn", name: "Bengali" }
];

const GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" }
];

const MovieMatcher = () => {
  const { user } = useAuth();
  const [step, setStep] = useState("setup");

  // Setup state
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedPreference, setSelectedPreference] = useState("mixed");
  const [selectedGenres, setSelectedGenres] = useState([]);

  // Browsing state
  const [movies, setMovies] = useState([]);
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [ratedMovies, setRatedMovies] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Favorites state
  const [favoriteMovies, setFavoriteMovies] = useState([]);

  // Profile state
  const [profileData, setProfileData] = useState(null);

  // Get movies from TMDB based on preferences
  const handleFetchMovies = async () => {
    if (selectedLanguages.length === 0) {
      setError("Select at least one language");
      return;
    }
    if (selectedGenres.length === 0) {
      setError("Select at least one genre");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/matcher/get-movies-by-preference", {
        languages: selectedLanguages,
        preference: selectedPreference,
        genres: selectedGenres.map(g => g.id)
      });

      if (!response.data.movies || response.data.movies.length === 0) {
        setError("No movies found. Try different preferences.");
        setLoading(false);
        return;
      }

      setMovies(response.data.movies);
      setStep("browsing");
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch movies");
      setLoading(false);
    }
  };

  // Rate movies with swipe
  const rateMovie = (rating) => {
    const movieId = movies[currentMovieIndex].id;
    setRatedMovies((prev) => ({
      ...prev,
      [movieId]: rating
    }));

    if (currentMovieIndex < movies.length - 1) {
      setCurrentMovieIndex((prev) => prev + 1);
    } else {
      const ratedCount = Object.keys(ratedMovies).length + 1;
      if (ratedCount < 10) {
        setError(`Please rate at least 10 movies. You've rated ${ratedCount}.`);
      } else {
        setStep("favorites");
      }
    }
  };

  // Save favorite movies and complete profile
  const handleSaveFavorites = async () => {
    if (favoriteMovies.length < 5) {
      setError("Select at least 5 favorite movies");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.post("/matcher/taste-profile", {
        preferredLanguages: selectedLanguages,
        movieRangePreference: selectedPreference
      });

      const moviesToSave = favoriteMovies.map((m) => ({
        tmdb_id: m.id,
        title: m.title,
        poster: m.poster,
        year: m.year,
        isFavorite: true
      }));

      await api.post("/matcher/add-movies", {
        movies: moviesToSave
      });

      setProfileData({
        languages: selectedLanguages,
        preference: selectedPreference,
        genres: selectedGenres,
        favoriteMovies
      });

      setStep("profile");
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save profile");
      setLoading(false);
    }
  };

  const currentMovie = movies[currentMovieIndex];

  return (
    <div className="movie-matcher-container">
      {/* STEP 1: Setup */}
      {step === "setup" && (
        <div className="matcher-step setup-step">
          <div className="step-header">
            <h1>🎬 Create Your Movie Taste Profile</h1>
            <p>Answer a few questions to get started</p>
          </div>

          {error && <div className="error-box">{error}</div>}

          {/* Languages Selection */}
          <div className="selection-group">
            <h2>📍 What languages do you watch?</h2>
            <div className="options-grid">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLanguages((prev) =>
                      prev.includes(lang.code)
                        ? prev.filter((l) => l !== lang.code)
                        : [...prev, lang.code]
                    );
                  }}
                  className={`option-btn ${selectedLanguages.includes(lang.code) ? "selected" : ""}`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          {/* Preference Selection */}
          <div className="selection-group">
            <h2>🎯 What type of movies do you prefer?</h2>
            <div className="preference-options">
              {[
                { value: "blockbuster", label: "🍿 Blockbuster", desc: "High popularity, big budget" },
                { value: "niche", label: "💎 Niche", desc: "High quality, hidden gems" },
                { value: "mixed", label: "🎭 Mixed", desc: "Both types" }
              ].map((pref) => (
                <button
                  key={pref.value}
                  onClick={() => setSelectedPreference(pref.value)}
                  className={`preference-btn ${selectedPreference === pref.value ? "selected" : ""}`}
                >
                  <div>{pref.label}</div>
                  <small>{pref.desc}</small>
                </button>
              ))}
            </div>
          </div>

          {/* Genres Selection */}
          <div className="selection-group">
            <h2>🎨 What are your favorite genres?</h2>
            <div className="genres-grid">
              {GENRES.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => {
                    setSelectedGenres((prev) =>
                      prev.find((g) => g.id === genre.id)
                        ? prev.filter((g) => g.id !== genre.id)
                        : [...prev, genre]
                    );
                  }}
                  className={`genre-btn ${selectedGenres.find((g) => g.id === genre.id) ? "selected" : ""}`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleFetchMovies}
            disabled={loading || selectedLanguages.length === 0 || selectedGenres.length === 0}
            className="btn-primary btn-large"
          >
            {loading ? "Loading Movies..." : "Get My 15 Movies"}
          </button>
        </div>
      )}

      {/* STEP 2: Browsing */}
      {step === "browsing" && currentMovie && (
        <div className="matcher-step browsing-step">
          <div className="step-header">
            <h2>✋ Rate These Movies</h2>
            <p>
              Movie {currentMovieIndex + 1} of {movies.length} (At least 10 required)
            </p>
          </div>

          {error && <div className="error-box">{error}</div>}

          <div className="movie-card-container">
            <div className="movie-card">
              <img src={currentMovie.poster} alt={currentMovie.title} />
              <div className="movie-info">
                <h3>{currentMovie.title}</h3>
                <p className="year">{currentMovie.year}</p>
                <p className="overview">{currentMovie.overview}</p>
                <div className="rating">
                  <span>⭐ {currentMovie.vote_average?.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="swipe-actions">
            <button onClick={() => rateMovie("dislike")} className="btn-swipe btn-left" title="Not my type">
              ⬅️ Not My Type
            </button>
            <button onClick={() => rateMovie("notWatched")} className="btn-swipe btn-bottom" title="Didn't watch">
              ⬇️ Didn't Watch
            </button>
            <button onClick={() => rateMovie("like")} className="btn-swipe btn-right" title="My type">
              ➡️ My Type
            </button>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentMovieIndex + 1) / movies.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* STEP 3: Favorites */}
      {step === "favorites" && (
        <div className="matcher-step favorites-step">
          <div className="step-header">
            <h2>❤️ Pick Your 5 Favorite Movies</h2>
            <p>These will get a boost in your matching algorithm</p>
          </div>

          {error && <div className="error-box">{error}</div>}

          <div className="favorites-grid">
            {movies.map((movie) => (
              <button
                key={movie.id}
                onClick={() => {
                  setFavoriteMovies((prev) =>
                    prev.find((m) => m.id === movie.id)
                      ? prev.filter((m) => m.id !== movie.id)
                      : prev.length < 5
                      ? [...prev, movie]
                      : prev
                  );
                }}
                className={`favorite-card ${favoriteMovies.find((m) => m.id === movie.id) ? "selected" : ""}`}
                disabled={
                  !favoriteMovies.find((m) => m.id === movie.id) && favoriteMovies.length >= 5
                }
              >
                <img src={movie.poster} alt={movie.title} />
                {favoriteMovies.find((m) => m.id === movie.id) && <div className="checkmark">✓</div>}
              </button>
            ))}
          </div>

          <div className="favorites-count">
            Selected: {favoriteMovies.length} / 5
          </div>

          <button onClick={handleSaveFavorites} disabled={loading || favoriteMovies.length < 5} className="btn-primary btn-large">
            {loading ? "Saving..." : "Complete Profile"}
          </button>
        </div>
      )}

      {/* STEP 4: Profile Complete */}
      {step === "profile" && profileData && (
        <div className="matcher-step profile-step">
          <div className="success-container">
            <div className="success-icon">🎉</div>
            <h2>Profile Complete!</h2>
            <p>Your movie taste profile has been saved.</p>

            <div className="profile-summary">
              <div className="summary-item">
                <strong>Languages:</strong> {profileData.languages.join(", ")}
              </div>
              <div className="summary-item">
                <strong>Preference:</strong> {profileData.preference.charAt(0).toUpperCase() + profileData.preference.slice(1)}
              </div>
              <div className="summary-item">
                <strong>Favorite Movies:</strong> {profileData.favoriteMovies.length}
              </div>
            </div>

            <p className="next-step">Now go to your profile to see your match percentage with friends! 👥</p>

            <button onClick={() => window.location.href = "/profile"} className="btn-primary btn-large">
              Go to Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieMatcher;
