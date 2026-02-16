import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GameGuessMovie from "../components/GameGuessMovie";
import "../styles/games.css";

const Games = () => {
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState(null);

  if (selectedGame === "guess-movie") {
    return (
      <div className="games-page">
        <div className="games-page-header">
          <button className="back-button" onClick={() => setSelectedGame(null)}>
            ← Back to Games
          </button>
          <h1>Guess the Movie by Cast</h1>
        </div>
        <div className="games-page-content">
          <GameGuessMovie />
        </div>
      </div>
    );
  }

  return (
    <div className="games-page">
      <div className="games-page-header">
        <h1>Game Library</h1>
        <p className="helper-text">Select a game to play and test your movie knowledge!</p>
      </div>

      <div className="game-cards-grid">
        <div 
          className="game-card-large"
          onClick={() => setSelectedGame("guess-movie")}
        >
          <div className="game-card-header">
            <span className="game-card-icon">🎬</span>
            <span className="game-badge">Popular</span>
          </div>
          <div className="game-card-body">
            <h2>Guess the Movie by Cast</h2>
            <p className="game-card-description">
              Test your movie knowledge! Identify movies from their cast members. Start with the last actor and work your way through the top 5 cast. Can you guess before all faces are revealed?
            </p>
            <div className="game-card-meta">
              <span className="difficulty">Difficulty: Medium</span>
              <span className="players">👥 Solo</span>
            </div>
          </div>
          <button className="play-button">Play Now</button>
        </div>

        {/* Placeholder for future games */}
        <div className="game-card-large coming-soon">
          <div className="game-card-header">
            <span className="game-card-icon">🎯</span>
            <span className="game-badge coming">Coming Soon</span>
          </div>
          <div className="game-card-body">
            <h2>Guess the Movie by Quote</h2>
            <p className="game-card-description">
              Identify famous movie quotes! Hear a memorable line and guess which movie it's from. Multiple choice or free answer mode.
            </p>
            <div className="game-card-meta">
              <span className="difficulty">Difficulty: Hard</span>
              <span className="players">👥 Solo</span>
            </div>
          </div>
          <button className="play-button" disabled>Coming Soon</button>
        </div>

        <div className="game-card-large coming-soon">
          <div className="game-card-header">
            <span className="game-card-icon">🎬</span>
            <span className="game-badge coming">Coming Soon</span>
          </div>
          <div className="game-card-body">
            <h2>Movie Plot Generator</h2>
            <p className="game-card-description">
              Complete movie plots! Given the beginning of a plot, guess how the movie ends. Based on real movie plots from across decades.
            </p>
            <div className="game-card-meta">
              <span className="difficulty">Difficulty: Hard</span>
              <span className="players">👥 Solo</span>
            </div>
          </div>
          <button className="play-button" disabled>Coming Soon</button>
        </div>
      </div>
    </div>
  );
};

export default Games;
