import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/games.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const GameGuessMovie = () => {
  const [gameState, setGameState] = useState("language-select"); // language-select, playing, won, lost
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [yearFrom, setYearFrom] = useState(1990);
  const [yearTo, setYearTo] = useState(new Date().getFullYear());
  const [currentMovie, setCurrentMovie] = useState(null);
  const [currentActorIndex, setCurrentActorIndex] = useState(4); // Start with last actor (index 4)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [guessedWrong, setGuessedWrong] = useState(false);
  const [showMovie, setShowMovie] = useState(false);
  const [loadingMovie, setLoadingMovie] = useState(false);
  // New features
  const [showClueActors, setShowClueActors] = useState(false);
  const [score, setScore] = useState(0);
  const [genreMatchFeedback, setGenreMatchFeedback] = useState(null);
  const [wrongGuessCount, setWrongGuessCount] = useState(0);

  const languages = [
    { code: "en", name: "🌍 English" },
    { code: "es", name: "🇪🇸 Spanish" },
    { code: "fr", name: "🇫🇷 French" },
    { code: "de", name: "🇩🇪 German" },
    { code: "it", name: "🇮🇹 Italian" },
    { code: "pt", name: "🇵🇹 Portuguese" },
    { code: "ja", name: "🇯🇵 Japanese" },
    { code: "ko", name: "🇰🇷 Korean" },
    { code: "hi", name: "🇮🇳 Hindi (Bollywood)" },
    { code: "te", name: "🇮🇳 Telugu (Tollywood)" },
    { code: "ta", name: "🇮🇳 Tamil (Kollywood)" },
    { code: "ml", name: "🇮🇳 Malayalam (Mollywood)" },
    { code: "kn", name: "🇮🇳 Kannada (Sandalwood)" },
    { code: "bn", name: "🇮🇳 Bengali" },
  ];

  // Fetch random movie with cast
  const fetchRandomMovie = async (lang, retryCount = 0) => {
    try {
      setLoadingMovie(true);
      // Add random seed to prevent caching and ensure different results each time
      const randomSeed = Math.random() * 1000000;
      const response = await axios.get(
        `${API_BASE_URL}/api/games/guess-the-movie/random?language=${lang}&yearFrom=${yearFrom}&yearTo=${yearTo}&seed=${randomSeed}`
      );

      if (!response.data) {
        // If no data, retry up to 5 times
        if (retryCount < 5) {
          await fetchRandomMovie(lang, retryCount + 1);
        }
        setLoadingMovie(false);
        return;
      }

      setCurrentMovie(response.data);
      setCurrentActorIndex(4); // Start with last actor
      setSearchQuery("");
      setSearchResults([]);
      setGuessedWrong(false);
      setShowMovie(false);
      setShowClueActors(false); // Reset clue
      setScore(0); // Reset score
      setGenreMatchFeedback(null); // Reset genre feedback
      setWrongGuessCount(0); // Reset wrong guess count
      setGameState("playing");
      setLoadingMovie(false);
    } catch (error) {
      console.error("Error fetching movie:", error);
      // Retry on error up to 5 times for endless loading
      if (retryCount < 5) {
        setTimeout(() => fetchRandomMovie(lang, retryCount + 1), 500);
      } else {
        setLoadingMovie(false);
      };
    }
  };

  const startGame = () => {
    fetchRandomMovie(selectedLanguage);
  };

  // Live search for movies
  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/games/guess-the-movie/search?query=${encodeURIComponent(searchQuery)}&language=${selectedLanguage}`
        );
        setSearchResults(response.data.results || []);
      } catch (error) {
        console.error("Error searching:", error);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, selectedLanguage]);

  // Calculate score based on wrong guesses
  const calculateScore = (wrongGuesses) => {
    const baseScore = 100 - (wrongGuesses * 20);
    return Math.max(baseScore, 20); // Minimum score = 20
  };

  // Check if guessed movie has same genre as current movie
  const checkGenreMatch = (guessedMovie) => {
    if (!currentMovie.genres || !guessedMovie.genres) return false;
    return guessedMovie.genres.some((genre) =>
      currentMovie.genres.some((mGenre) => mGenre.id === genre.id)
    );
  };

  const makeGuess = (guessedMovie) => {
    if (guessedMovie.id === currentMovie.id) {
      // Correct guess!
      const finalScore = calculateScore(wrongGuessCount);
      setScore(finalScore);
      setGameState("won");
    } else {
      // Wrong guess
      const newWrongCount = wrongGuessCount + 1;
      setWrongGuessCount(newWrongCount);

      // Check genre match for feedback
      const isGenreMatch = checkGenreMatch(guessedMovie);
      setGenreMatchFeedback(isGenreMatch ? "🔥 Close! Same genre." : "❌ Not the same vibe.");

      // Clear feedback after 2 seconds
      setTimeout(() => setGenreMatchFeedback(null), 2000);

      if (currentActorIndex > 0) {
        setCurrentActorIndex(currentActorIndex - 1);
        setGuessedWrong(true);
        setTimeout(() => setGuessedWrong(false), 500);
        setSearchQuery("");
        setSearchResults([]);
      } else {
        // All clues revealed, they lost
        setGameState("lost");
        setShowMovie(true);
      }
    }
  };

  // Handle clue button - show current + previous actor
  const handleShowClue = () => {
    setShowClueActors(true);
    setTimeout(() => setShowClueActors(false), 3000); // Auto hide after 3 seconds
  };

  const getVisibleActors = () => {
    if (!showClueActors) {
      return currentMovie.cast.slice(currentActorIndex, currentActorIndex + 1);
    }
    // Show current + previous actor (or just current if at index 0)
    const startIdx = Math.max(currentActorIndex - 1, 0);
    return currentMovie.cast.slice(startIdx, currentActorIndex + 1);
  };

  const skipGame = () => {
    setGameState("lost");
    setShowMovie(true);
  };

  const nextGame = () => {
    fetchRandomMovie(selectedLanguage);
  };

  // Language Selection
  if (gameState === "language-select") {
    return (
      <div className="game-container">
        <h2>Guess the Movie by Cast</h2>
        <p className="game-description">Select a language and movie year range, then try to guess the movie from the cast faces!</p>
        
        <div className="language-selector">
          <label>🎬 Choose Film Industry:</label>
          <select 
            value={selectedLanguage} 
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="language-dropdown"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>

          <div className="year-range-selector">
            <label>📅 Movie Year Range:</label>
            <div className="year-inputs">
              <div className="year-input-group">
                <label>From:</label>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={yearFrom}
                  onChange={(e) => {
                    const val = Math.min(parseInt(e.target.value) || 1900, yearTo);
                    setYearFrom(val);
                  }}
                  className="year-input"
                />
              </div>
              <div className="year-input-group">
                <label>To:</label>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={yearTo}
                  onChange={(e) => {
                    const val = Math.max(parseInt(e.target.value) || new Date().getFullYear(), yearFrom);
                    setYearTo(val);
                  }}
                  className="year-input"
                />
              </div>
            </div>

            <div className="year-slider">
              <input
                type="range"
                min="1900"
                max={new Date().getFullYear()}
                value={yearFrom}
                onChange={(e) => {
                  const val = Math.min(parseInt(e.target.value), yearTo);
                  setYearFrom(val);
                }}
                className="slider slider-from"
              />
              <input
                type="range"
                min="1900"
                max={new Date().getFullYear()}
                value={yearTo}
                onChange={(e) => {
                  const val = Math.max(parseInt(e.target.value), yearFrom);
                  setYearTo(val);
                }}
                className="slider slider-to"
              />
            </div>

            <div className="year-display">
              <p className="year-text">
                Showing movies from <span className="year-highlight">{yearFrom}</span> to <span className="year-highlight">{yearTo}</span>
              </p>
            </div>
          </div>

          <button onClick={startGame} className="start-button" disabled={loadingMovie}>
            {loadingMovie ? "Loading..." : "Start Game"}
          </button>
        </div>
      </div>
    );
  }

  if (!currentMovie && gameState === "playing") {
    return <div className="game-container"><p>Loading game...</p></div>;
  }

  // Game Playing
  if (gameState === "playing") {
    const cluesRemaining = currentActorIndex + 1;
    const totalClues = 5;
    const potentialScore = calculateScore(wrongGuessCount);
    const visibleActors = getVisibleActors();

    return (
      <div className="game-container">
        <div className="game-header">
          <div className="header-left">
            <h2>Guess the Movie</h2>
            <span className="clues-counter">Clue {totalClues - cluesRemaining + 1}/{totalClues}</span>
          </div>
          <div className="header-right">
            <span className="potential-score">⭐ Score: {potentialScore}</span>
          </div>
        </div>

        {/* Multiple Actor Faces */}
        <div className={`actors-display ${guessedWrong ? "shake" : ""}`}>
          {visibleActors.map((actor, idx) => (
            <div key={idx} className="actor-card">
              {actor?.profile_path ? (
                <img 
                  src={`https://image.tmdb.org/t/p/w300${actor.profile_path}`}
                  alt={actor.name}
                  className="actor-image"
                />
              ) : (
                <div className="actor-placeholder">No Image</div>
              )}
              <p className="actor-name">{actor?.name}</p>
            </div>
          ))}
        </div>

        {/* Genre Match Feedback */}
        {genreMatchFeedback && (
          <div className="genre-feedback">
            {genreMatchFeedback}
          </div>
        )}

        {/* Search Box */}
        <div className="search-box">
          <input
            type="text"
            placeholder="Search the movie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            autoFocus
          />
          
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((movie) => (
                <button
                  key={movie.id}
                  className="search-result"
                  onClick={() => makeGuess(movie)}
                >
                  <img 
                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : ""}
                    alt={movie.title}
                    className="result-poster"
                  />
                  <div className="result-info">
                    <p className="result-title">{movie.title || movie.name}</p>
                    <p className="result-year">{new Date(movie.release_date).getFullYear() || "N/A"}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clues Progress */}
        <div className="clues-progress">
          <p>Clues revealed: {totalClues - cluesRemaining}/{totalClues}</p>
          {guessedWrong && <p className="wrong-message">Wrong guess! Next clue:</p>}
        </div>

        {/* Buttons */}
        <div className="game-buttons">
          <button 
            onClick={handleShowClue}
            className="clue-button"
          >
            🔍 Clue
          </button>
          <button 
            onClick={() => {
              if (currentActorIndex > 0) {
                setCurrentActorIndex(currentActorIndex - 1);
                setSearchQuery("");
                setSearchResults([]);
              }
            }} 
            className="see-cast-button"
            disabled={currentActorIndex === 0}
          >
            See Other Cast ({currentActorIndex} left)
          </button>
          <button onClick={skipGame} className="reveal-button">Reveal Movie</button>
        </div>
      </div>
    );
  }

  // Win Screen
  if (gameState === "won") {
    return (
      <div className="game-container result-screen">
        <h2>🎉 You Won!</h2>
        <div className="score-display">
          <p className="final-score">Score: {score} points</p>
        </div>
        <div className="movie-reveal">
          {currentMovie.poster_path && (
            <img 
              src={`https://image.tmdb.org/t/p/w300${currentMovie.poster_path}`}
              alt={currentMovie.title}
              className="reveal-poster"
            />
          )}
          <h3>{currentMovie.title}</h3>
          <p className="reveal-year">{new Date(currentMovie.release_date).getFullYear()}</p>
        </div>
        <button onClick={nextGame} className="next-button">Next Movie</button>
      </div>
    );
  }

  // Loss Screen
  if (gameState === "lost") {
    return (
      <div className="game-container result-screen">
        <h2>Game Over</h2>
        <div className="score-display">
          <p className="final-score">Score: 0 points</p>
        </div>
        <div className="movie-reveal">
          {currentMovie.poster_path && (
            <img 
              src={`https://image.tmdb.org/t/p/w300${currentMovie.poster_path}`}
              alt={currentMovie.title}
              className="reveal-poster"
            />
          )}
          <h3>{currentMovie.title}</h3>
          <p className="reveal-year">{new Date(currentMovie.release_date).getFullYear()}</p>
          <p className="reveal-overview">{currentMovie.overview}</p>
        </div>
        <button onClick={nextGame} className="next-button">Try Another</button>
      </div>
    );
  }
};

export default GameGuessMovie;
