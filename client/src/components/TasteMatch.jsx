import React, { useState, useEffect } from "react";
import api from "../api/axios";
import TasteMatchCard from "./TasteMatchCard";
import TasteMatchResult from "./TasteMatchResult";
import "../styles/tasteMatch.css";

const TasteMatch = ({ friendId, friendName, onClose }) => {
  const [phase, setPhase] = useState("loading"); // loading, checking, voting, result, error
  const [currentMovie, setCurrentMovie] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [votesCount, setVotesCount] = useState(0);
  const [minRequired] = useState(10);
  const [error, setError] = useState("");
  const [isLoadingMovie, setIsLoadingMovie] = useState(false);

  // Check user's stats on mount
  useEffect(() => {
    checkUserStats();
  }, []);

  const checkUserStats = async () => {
    try {
      setPhase("loading");
      const response = await api.get("/api/taste-match/user-stats");
      setUserStats(response.data);

      if (response.data.total_rated >= minRequired) {
        // User has enough votes, load first movie
        fetchNextMovie();
      } else {
        setPhase("checking");
      }
    } catch (err) {
      console.error("Error checking stats:", err);
      setError("Failed to load taste match data");
      setPhase("error");
    }
  };

  const fetchNextMovie = async () => {
    try {
      setIsLoadingMovie(true);
      const response = await api.get("/api/taste-match/next-movie");
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
    setVotesCount((prev) => prev + 1);

    // After 5 votes during session, check if we can calculate match
    if (votesCount + 1 >= 5) {
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
            <h2>Not enough data yet!</h2>
            <p>
              You need to rate at least <strong>{minRequired} movies</strong> to compare taste.
            </p>
            <p className="current-count">
              You've rated <strong>{userStats?.total_rated || 0}</strong> movie{userStats?.total_rated !== 1 ? "s" : ""}
            </p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (userStats?.total_rated / minRequired) * 100)}%`
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
            <h2>Rate some movies!</h2>
            <p>Help us find your match with {friendName}</p>
            <div className="votes-counter">
              Votes this session: <strong>{votesCount}</strong>
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
