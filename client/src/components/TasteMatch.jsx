import React, { useState, useEffect } from "react";
import api from "../api/axios";
import TasteMatchCard from "./TasteMatchCard";
import TasteMatchResult from "./TasteMatchResult";
import "../styles/tasteMatch.css";

const TasteMatch = ({ friendId, friendName, onClose }) => {
  const [phase, setPhase] = useState("loading"); // loading, voting, waiting, report, error
  const [currentMovie, setCurrentMovie] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [votesCount, setVotesCount] = useState(0);
  const [votesRequired] = useState(20); // 20 votes to form match
  const [error, setError] = useState("");
  const [isLoadingMovie, setIsLoadingMovie] = useState(false);
  const [friendVotesCount, setFriendVotesCount] = useState(0);

  // Check session state on mount
  useEffect(() => {
    checkSessionState();
  }, []);

  const checkSessionState = async () => {
    try {
      setPhase("loading");
      const response = await api.get(`/api/taste-match/session/${friendId}`);
      const state = response.data;

      if (state.status === "report_ready") {
        // Show saved report
        setMatchResult(state.report);
        setPhase("report");
      } else if (state.status === "waiting_for_friend") {
        // One user is done, waiting for other
        setVotesCount(state.your_votes);
        setFriendVotesCount(state.friend_votes);
        setPhase("waiting");
      } else if (state.status === "voting_in_progress") {
        // Continue voting
        setVotesCount(state.votes_current_user);
        setFriendVotesCount(state.votes_friend);
        if (state.votes_current_user < votesRequired) {
          fetchNextMovie();
        } else {
          // Completed voting, now waiting
          setPhase("waiting");
        }
      } else if (state.status === "not_started") {
        // Start fresh
        fetchNextMovie();
      }
    } catch (err) {
      console.error("Error checking session state:", err);
      setError("Failed to load taste match data");
      setPhase("error");
    }
  };

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
        // No more movies available
        console.log("No more movies available");
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

    // After 20 votes, move to waiting phase
    if (newVoteCount >= votesRequired) {
      setPhase("waiting");
      // Poll for friend's votes every 3 seconds
      const pollInterval = setInterval(async () => {
        try {
          const state = await api.get(`/api/taste-match/session/${friendId}`);
          if (state.data.status === "report_ready") {
            clearInterval(pollInterval);
            setMatchResult(state.data.report);
            setPhase("report");
          }
        } catch (err) {
          console.error("Error polling for report:", err);
        }
      }, 3000);
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
            <h2>Let's start!</h2>
            <p>
              Rate <strong>{votesRequired} movies</strong> with {friendName} to see your match!
            </p>
            <button className="btn btn-primary" onClick={startVoting}>
              Start Voting
            </button>
            <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: "12px" }}>
              Cancel
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
              Your progress: <strong>{votesCount}/{votesRequired}</strong>
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
              friendId={friendId}
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

  // Phase: Waiting for friend to vote
  if (phase === "waiting") {
    return (
      <div className="taste-match-modal">
        <div className="taste-match-content">
          <button className="close-btn" onClick={onClose}>
            ×
          </button>

          <div className="waiting-state">
            <div className="icon-large">⏳</div>
            <h2>Voting Complete! 🎉</h2>
            <p>You've voted on all {votesRequired} movies</p>
            
            <div className="voting-stats">
              <div className="stat-item">
                <span className="stat-label">Your Votes:</span>
                <span className="stat-value">{votesCount}/{votesRequired}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{friendName}'s Votes:</span>
                <span className="stat-value">{friendVotesCount}/{votesRequired}</span>
              </div>
            </div>

            {friendVotesCount >= votesRequired ? (
              <div className="message success">
                <p>✓ {friendName} has completed their votes!</p>
                <p className="small">Generating your match report...</p>
                <div className="spinner" style={{ marginTop: "16px" }} />
              </div>
            ) : (
              <div className="message info">
                <p>Waiting for {friendName} to rate {votesRequired - friendVotesCount} more movies...</p>
              </div>
            )}

            <button className="btn btn-primary" onClick={onClose} style={{ marginTop: "24px" }}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Phase: Report ready
  if (phase === "report" && matchResult) {
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
