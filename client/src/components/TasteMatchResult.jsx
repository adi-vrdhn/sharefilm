import React from "react";

const TasteMatchResult = ({ matchData, friendName, onClose }) => {
  const percentage = matchData.match_percentage || 0;
  const genreCompatibility = matchData.genre_compatibility || {};
  const summary = matchData.summary || "";

  // Get top 5 genres by compatibility
  const topGenres = Object.entries(genreCompatibility)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Determine match tier
  const getMatchTier = (percentage) => {
    if (percentage >= 80) return { tier: "Amazing", color: "#10b981" };
    if (percentage >= 60) return { tier: "Great", color: "#3b82f6" };
    if (percentage >= 40) return { tier: "Good", color: "#f59e0b" };
    return { tier: "Different", color: "#ef4444" };
  };

  const matchTier = getMatchTier(percentage);

  return (
    <div className="taste-match-result-container">
      <button className="close-btn" onClick={onClose}>
        ×
      </button>

      <div className="result-header">
        <h1>Movie Taste Match</h1>
        <p className="result-subtitle">with {friendName}</p>
      </div>

      <div className="result-main">
        <div className="percentage-circle" style={{ borderColor: matchTier.color }}>
          <div className="percentage-value">{Math.round(percentage)}%</div>
          <div className="percentage-tier" style={{ color: matchTier.color }}>
            {matchTier.tier}
          </div>
        </div>

        <div className="result-summary">
          <p>{summary}</p>
        </div>
      </div>

      {topGenres.length > 0 && (
        <div className="result-genres">
          <h3>Genre Compatibility</h3>
          <div className="genre-bars">
            {topGenres.map(([genre, compatibility]) => (
              <div key={genre} className="genre-bar-item">
                <label>{genre}</label>
                <div className="bar-container">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${compatibility * 100}%`,
                      backgroundColor: matchTier.color
                    }}
                  />
                </div>
                <span className="percentage">{Math.round(compatibility * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="btn btn-primary" onClick={onClose}>
        Back
      </button>
    </div>
  );
};

export default TasteMatchResult;
