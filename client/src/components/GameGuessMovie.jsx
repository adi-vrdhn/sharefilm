import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/games.css";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_KEY;

const GameGuessMovie = () => {
  const [gameState, setGameState] = useState("language-select"); // language-select, playing, won, lost
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [currentMovie, setCurrentMovie] = useState(null);
  const [currentActorIndex, setCurrentActorIndex] = useState(4); // Start with last actor (index 4)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [guessedWrong, setGuessedWrong] = useState(false);
  const [showMovie, setShowMovie] = useState(false);
  const [loadingMovie, setLoadingMovie] = useState(false);

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ja", name: "Japanese" },
    { code: "hi", name: "Hindi" },
    { code: "ko", name: "Korean" },
  ];

  // Fetch random movie with cast
  const fetchRandomMovie = async (lang) => {
    try {
      setLoadingMovie(true);
      const response = await axios.get(
        `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=${lang}-${lang.toUpperCase()}&sort_by=popularity.desc&page=${Math.floor(Math.random() * 50) + 1}`
      );
      
      if (response.data.results.length === 0) {
        fetchRandomMovie(lang);
        return;
      }

      const randomMovie = response.data.results[Math.floor(Math.random() * response.data.results.length)];

      // Get full details and credits
      const creditsResponse = await axios.get(
        `https://api.themoviedb.org/3/movie/${randomMovie.id}/credits?api_key=${TMDB_API_KEY}`
      );

      const topCast = creditsResponse.data.cast.slice(0, 5);
      
      if (topCast.length < 2) {
        fetchRandomMovie(lang);
        return;
      }

      setCurrentMovie({
        ...randomMovie,
        cast: topCast,
      });

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
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}&language=${selectedLanguage}`
        );
        setSearchResults(response.data.results.slice(0, 8));
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
  if (!TMDB_API_KEY) {
    return (
      <div className="game-container">
        <h2>Game Not Available</h2>
        <p className="game-description" style={{ color: "#ff6b6b" }}>
          TMDB API key is not configured. Please add VITE_TMDB_KEY to your .env file.
        </p>
      </div>
    );
  }

  if (gameState === "language-select") {
    return (
      <div className="game-container">
        <h2>Guess the Movie by Cast</h2>
        <p className="game-description">Select a language and try to guess the movie from the cast faces!</p>
        
        <div className="language-selector">
          <label>Choose Language:</label>
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
          <button onClick={skipGame} className="skip-button">Skip</button>
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
