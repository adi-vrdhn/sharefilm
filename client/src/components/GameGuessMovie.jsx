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
  const fetchRandomMovie = async (lang) => {
    try {
      setLoadingMovie(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/games/guess-the-movie/random?language=${lang}&yearFrom=${yearFrom}&yearTo=${yearTo}`
      );

      if (!response.data) {
        fetchRandomMovie(lang);
        setLoadingMovie(false);
        return;
      }

      setCurrentMovie(response.data);
      setCurrentActorIndex(4); // Start with last actor
      setSearchQuery("");
      setSearchResults([]);
      setGuessedWrong(false);
      setShowMovie(false);
      setGameState("playing");
      setLoadingMovie(false);
    } catch (error) {
      console.error("Error fetching movie:", error);
      setLoadingMovie(false);
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

  const makeGuess = (movieId) => {
    if (movieId === currentMovie.id) {
      // Correct guess!
      setGameState("won");
    } else {
      // Wrong guess
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
    const currentActor = currentMovie.cast[currentActorIndex];
    const cluesRemaining = currentActorIndex + 1;
    const totalClues = 5;

    return (
      <div className="game-container">
        <div className="game-header">
          <h2>Guess the Movie</h2>
          <span className="clues-counter">Clue {totalClues - cluesRemaining + 1}/{totalClues}</span>
        </div>

        {/* Actor Face */}
        <div className={`actor-display ${guessedWrong ? "shake" : ""}`}>
          {currentActor?.profile_path ? (
            <img 
              src={`https://image.tmdb.org/t/p/w300${currentActor.profile_path}`}
              alt={currentActor.name}
              className="actor-image"
            />
          ) : (
            <div className="actor-placeholder">No Image</div>
          )}
          <p className="actor-name">{currentActor?.name}</p>
        </div>

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
                  onClick={() => makeGuess(movie.id)}
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
