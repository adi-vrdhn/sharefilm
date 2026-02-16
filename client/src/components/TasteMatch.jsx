import React, { useState, useEffect } from "react";
import api from "../api/axios";
import TasteMatchCard from "./TasteMatchCard";
import TasteMatchResult from "./TasteMatchResult";
import "../styles/tasteMatch.css";

const TasteMatch = ({ friendId, friendName, onClose }) => {
  const [phase, setPhase] = useState("loading"); // loading, voting, result, error
  const [currentMovie, setCurrentMovie] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [votesCount, setVotesCount] = useState(0);
  const [votesRequired] = useState(20); // 20 votes to form match
  const [error, setError] = useState("");
  const [isLoadingMovie, setIsLoadingMovie] = useState(false);

  // Start voting immediately - no prerequisites
  useEffect(() => {
    startVoting();
  }, []);

  const startVoting = async () => {
    try {
      setPhase("loading");
      fetchNextMovie();
    } catch (err) {
      console.error("Error starting voting:", err);
      setError("Failed to start taste match");
      setPhase("error");
    }
  };

  const checkUserStats = async () => {
    // Deprecated - kept for backwards compatibility
  };

  const fetchNextMovie = async () => {
    try {
      setIsLoadingMovie(true);
      const response = await api.get(`/api/taste-match/next-movie/${friendId}`);
      setCurrentMovie(response.data);
      setPhase("voting");
    } catch (err) {
      if (err.response?.status === 404) {
        // No more movies available, calculate match
        calculateMatch();
      } else {
        console.error("Error fetching movie:", err);
        setError("Failed to load movie");
        setPhase("error");
      }
    } finally {
      setIsLoadingMovie(false);
    }
  };

  const handleMovieRated = async () => {
    const newVoteCount = votesCount + 1;
    setVotesCount(newVoteCount);

    // After 20 votes, calculate match
    if (newVoteCount >= votesRequired) {
      calculateMatch();
    } else {
      // Fetch next movie
      fetchNextMovie();
    }
  };

  const calculateMatch = async () => {
    try {
      setPhase("loading");
      const response = await api.get(`/api/taste-match/compare/${friendId}`);

      if (response.data.error) {
        setError(response.data.error);
        setPhase("error");
      } else {
        setMatchResult(response.data);
        setPhase("result");
      }
    } catch (err) {
      console.error("Error calculating match:", err);
      setError(err.response?.data?.error || "Failed to calculate match");
      setPhase("error");
    }
  };

  // Phase: User doesn't have enough votes yet
  if (phase === "checking") {
    return (
      <div className="taste-match-modal">
        <div className="taste-match-content">
          <button className="close-btn" onClick={onClose}>
            ×
          </button>

          <div className="checking-phase">
            <div className="icon-large">🎬</div>
            <h2>Rate 20 movies!</h2>
            <p>
              Help us understand your taste by rating <strong>{votesRequired} movies</strong> with your friend.
            </p>
            <p className="current-count">
              Progress: <strong>{votesCount}</strong>/{votesRequired}
            </p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (votesCount / votesRequired) * 100)}%`
                }}
              />
            </div>
            <button className="btn btn-primary" onClick={onClose}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Phase: Voting
  if (phase === "voting") {
    return (
      <div className="taste-match-modal">
        <div className="taste-match-content">
          <button className="close-btn" onClick={onClose}>
            ×
          </button>

        <div className="voting-header">
            <h2>Rate movies with {friendName}! 🎬</h2>
            <p>Vote on {votesRequired} movies to generate your match</p>
            <div className="votes-counter">
              Progress: <strong>{votesCount}/{votesRequired}</strong>
            </div>
            <div className="progress-bar-inline">
              <div
                className="progress-fill"
                style={{
                  width: `${(votesCount / votesRequired) * 100}%`
                }}
              />
            </div>
          </div>

          {currentMovie ? (
            <TasteMatchCard
              movie={currentMovie}
              onRate={handleMovieRated}
              isLoading={isLoadingMovie}
            />
          ) : (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading movie...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Phase: Showing result
  if (phase === "result" && matchResult) {
    return (
      <div className="taste-match-modal">
        <div className="taste-match-content">
          <TasteMatchResult
            matchData={matchResult}
            friendName={friendName}
            onClose={onClose}
          />
        </div>
      </div>
    );
  }

  // Phase: Error
  if (phase === "error") {
    return (
      <div className="taste-match-modal">
        <div className="taste-match-content">
          <button className="close-btn" onClick={onClose}>
            ×
          </button>

          <div className="error-state">
            <div className="icon-large">⚠️</div>
            <h2>Oops!</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={onClose}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Phase: Loading
  return (
    <div className="taste-match-modal">
      <div className="taste-match-content">
        <div className="loading-state">
          <div className="spinner" />
          <p>Setting up taste match...</p>
        </div>
      </div>
    </div>
  );
};

export default TasteMatch;
