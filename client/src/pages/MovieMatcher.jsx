import React, { useState, useRef } from "react";
import api from "../api/axios";

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

const MovieMatcher = () => {
  // Main state
  const [step, setStep] = useState("onboarding"); // onboarding | selection | matching | report
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Onboarding state
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [movieRangePreference, setMovieRangePreference] = useState("mixed");

  // Movie selection state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Friend match state
  const [friends, setFriends] = useState([]);
  const [matchReport, setMatchReport] = useState(null);

  // STEP 1: Onboarding
  const handleOnboardingComplete = async () => {
    if (selectedLanguages.length === 0) {
      setError("Please select at least one language");
      return;
    }

    try {
      setLoading(true);
      await api.post("/matcher/taste-profile", {
        preferredLanguages: selectedLanguages,
        movieRangePreference
      });
      setStep("selection");
      setError("");
    } catch (err) {
      setError("Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Movie Search & Selection
  const handleSearch = (query) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const response = await api.get(`/searchMovie?q=${encodeURIComponent(query)}`);
        setSearchResults(response.data.slice(0, 8));
      } catch (err) {
        console.error("Search error:", err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const toggleMovieSelection = (movie) => {
    const isSelected = selectedMovies.some((m) => m.tmdb_id === movie.tmdb_id);

    if (isSelected) {
      setSelectedMovies(selectedMovies.filter((m) => m.tmdb_id !== movie.tmdb_id));
    } else {
      setSelectedMovies([...selectedMovies, movie]);
    }
  };

  const handleSaveMovies = async () => {
    if (selectedMovies.length < 5) {
      setError(`Please select at least 5 movies (${selectedMovies.length}/5)`);
      return;
    }

    try {
      setLoading(true);
      
      // Format movies with required fields for backend
      const formattedMovies = selectedMovies.map(m => ({
        tmdb_id: m.tmdb_id || m.id,
        title: m.title,
        poster: m.poster,
        year: m.year || m.release_date?.split('-')[0],
        overview: m.overview || '',
        genres: m.genres || m.genre_ids || [],
        language: m.original_language || 'en',
        cast: m.cast || [],
        director: m.director || ''
      }));

      console.log("Saving formatted movies:", formattedMovies);

      await api.post("/matcher/add-movies", { movies: formattedMovies });

      // Fetch friends
      const friendsResponse = await api.get("/getFriends");
      setFriends(friendsResponse.data || []);

      setStep("matching");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save movies");
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Friend Selection & Matching
  const handleStartMatch = async (friend) => {
    try {
      setLoading(true);
      const response = await api.post(`/matcher/calculate-match/${friend.id}`);
      setMatchReport({
        friend,
        ...response.data
      });
      setStep("report");
      setError("");
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response.data.message);
      } else {
        setError("Failed to calculate match");
      }
    } finally {
      setLoading(false);
    }
  };

  // Button handler to return to selection and clear state
  const handleBackToSelection = () => {
    setStep("selection");
    setError("");
  };

  // Restart entire flow
  const handleCompleteRestart = () => {
    setStep("onboarding");
    setSelectedLanguages([]);
    setSelectedMovies([]);
    setSearchQuery("");
    setSearchResults([]);
    setMatchReport(null);
    setError("");
  };

  return (
    <div style={styles.container}>
      <style>{cssStyles}</style>

      {/* STEP 1: Language Onboarding */}
      {step === "onboarding" && (
        <div style={styles.stepContainer} className="matcher-step">
          <div style={styles.stepHeader}>
            <h2>Movie Matcher</h2>
            <p>Find your perfect movie match with a friend!</p>
          </div>

          <h3 style={styles.subheading}>Select Your Preferred Languages</h3>
          <div style={styles.languageGrid}>
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
                style={{
                  ...styles.languageBtn,
                  ...(selectedLanguages.includes(lang.code) ? styles.languageBtnSelected : {})
                }}
              >
                {lang.name}
              </button>
            ))}
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <button
            onClick={handleOnboardingComplete}
            disabled={loading}
            style={{
              ...styles.btnPrimary,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </div>
      )}

      {/* STEP 2: Movie Selection */}
      {step === "selection" && (
        <div style={styles.stepContainer} className="matcher-step">
          <div style={styles.stepHeader}>
            <h2>Select Your Movies</h2>
            <p>Choose at least 5 movies you love</p>
          </div>

          <div style={styles.searchBox}>
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.searchResults}>
            {searchResults.map((movie) => (
              <div
                key={movie.tmdb_id}
                onClick={() => toggleMovieSelection(movie)}
                style={{
                  ...styles.movieCard,
                  ...(selectedMovies.some((m) => m.tmdb_id === movie.tmdb_id)
                    ? styles.movieCardSelected
                    : {})
                }}
              >
                <img
                  src={movie.poster || "https://via.placeholder.com/150x225?text=No+Poster"}
                  alt={movie.title}
                  style={styles.movieImage}
                />
                {selectedMovies.some((m) => m.tmdb_id === movie.tmdb_id) && (
                  <div style={styles.checkmark}>✓</div>
                )}
              </div>
            ))}
          </div>

            <div style={styles.selectedCount}>
            Selected: {selectedMovies.length} / 5
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <div style={styles.buttonGroup}>
            <button onClick={handleCompleteRestart} style={styles.btnSecondary}>
              Start Over
            </button>
            <button
              onClick={handleSaveMovies}
              disabled={loading || selectedMovies.length < 5}
              style={{
                ...styles.btnPrimary,
                ...(selectedMovies.length < 5 ? { opacity: 0.5, cursor: "not-allowed" } : {}),
                ...(loading ? { opacity: 0.7 } : {})
              }}
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Friend Selection */}
      {step === "matching" && (
        <div style={styles.stepContainer} className="matcher-step">
          <div style={styles.stepHeader}>
            <h2>Choose a Friend</h2>
            <p>Select a friend to see your movie match</p>
          </div>

          {friends.length === 0 ? (
            <p style={styles.noFriendsMsg}>
              No friends found. Add some friends first!
            </p>
          ) : (
            <div style={styles.friendList}>
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  onClick={() => handleStartMatch(friend)}
                  style={styles.friendCard}
                >
                  <div style={styles.friendAvatar}>
                    {friend.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.friendName}>{friend.name}</div>
                </div>
              ))}
            </div>
          )}

          {error && <div style={styles.errorBox}>{error}</div>}

          <button onClick={handleBackToSelection} style={styles.btnSecondary}>
            Back
          </button>
        </div>
      )}

      {/* STEP 4: Match Report */}
      {step === "report" && matchReport && (
        <div style={styles.reportContainer} className="matcher-step">
          <div style={styles.stepHeader}>
            <h2>Match Report</h2>
            <p>You and {matchReport.friend.name}</p>
          </div>

          <div style={styles.matchScore}>
            <div style={styles.matchPercentage}>{matchReport.matchScore}%</div>
            <p style={styles.matchLabel}>Movie Match</p>
          </div>

          {matchReport.matchingMovies && matchReport.matchingMovies.length > 0 && (
            <div style={styles.moviesGrid}>
              <h3 style={styles.moviesTitle}>Movies You Both Love</h3>
              <div style={styles.moviesList}>
                {matchReport.matchingMovies.slice(0, 5).map((movie) => (
                  <div key={movie.id} style={styles.movieItem}>
                    {movie.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchReport.recommendations && matchReport.recommendations.length > 0 && (
            <div style={styles.moviesGrid}>
              <h3 style={styles.moviesTitle}>Try Watching Together</h3>
              <div style={styles.moviesList}>
                {matchReport.recommendations.slice(0, 5).map((movie) => (
                  <div key={movie.id} style={styles.movieItem}>
                    {movie.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleCompleteRestart} style={styles.btnPrimary}>
            Try Another Match
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "20px",
    color: "#f0f0f0"
  },
  stepContainer: {
    animation: "fadeIn 0.3s ease-in"
  },
  stepHeader: {
    textAlign: "center",
    marginBottom: "30px"
  },
  stepHeader: {
    textAlign: "center",
    marginBottom: "30px"
  },
  stepHeader: {
    h2: { fontSize: "28px", color: "#fbbf24", margin: "0 0 10px 0" },
    p: { color: "#9ca3af", fontSize: "14px" }
  },
  subheading: {
    fontSize: "18px",
    color: "#f0f0f0",
    marginTop: "30px",
    marginBottom: "20px"
  },
  languageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: "12px",
    margin: "20px 0"
  },
  languageBtn: {
    padding: "12px",
    border: "2px solid #374151",
    background: "#1f2937",
    color: "#f0f0f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.2s"
  },
  languageBtnSelected: {
    background: "#fbbf24",
    color: "#000",
    borderColor: "#fbbf24"
  },
  searchBox: {
    position: "relative",
    margin: "20px 0"
  },
  searchInput: {
    width: "100%",
    padding: "12px",
    background: "#1f2937",
    border: "2px solid #374151",
    borderRadius: "8px",
    color: "#f0f0f0",
    fontSize: "16px"
  },
  searchResults: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "15px",
    margin: "20px 0"
  },
  movieCard: {
    position: "relative",
    cursor: "pointer",
    borderRadius: "8px",
    overflow: "hidden",
    transition: "transform 0.2s",
    border: "none"
  },
  movieCardSelected: {
    border: "3px solid #fbbf24"
  },
  movieImage: {
    width: "100%",
    height: "225px",
    objectFit: "cover"
  },
  checkmark: {
    position: "absolute",
    top: "10px",
    right: "10px",
    width: "40px",
    height: "40px",
    background: "#fbbf24",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    color: "#000",
    fontWeight: "bold"
  },
  selectedCount: {
    textAlign: "center",
    fontSize: "14px",
    color: "#9ca3af",
    margin: "15px 0"
  },
  btnPrimary: {
    width: "100%",
    padding: "12px",
    background: "#fbbf24",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "20px",
    transition: "all 0.2s"
  },
  btnSecondary: {
    flex: 1,
    padding: "12px",
    background: "#374151",
    color: "#f0f0f0",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    marginTop: "20px"
  },
  errorBox: {
    background: "#7f1d1d",
    borderLeft: "4px solid #dc2626",
    color: "#fecaca",
    padding: "12px",
    borderRadius: "8px",
    margin: "15px 0",
    fontSize: "14px"
  },
  friendList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "15px",
    margin: "20px 0"
  },
  friendCard: {
    padding: "20px",
    background: "#1f2937",
    borderRadius: "12px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "2px solid #374151"
  },
  friendAvatar: {
    width: "80px",
    height: "80px",
    background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
    borderRadius: "50%",
    margin: "0 auto 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    color: "#000",
    fontSize: "30px"
  },
  friendName: {
    fontWeight: "600",
    fontSize: "16px"
  },
  noFriendsMsg: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: "30px",
    fontSize: "16px"
  },
  reportContainer: {
    background: "#1f2937",
    borderRadius: "12px",
    padding: "30px",
    marginTop: "20px"
  },
  matchScore: {
    textAlign: "center",
    marginBottom: "30px"
  },
  matchPercentage: {
    fontSize: "48px",
    fontWeight: "bold",
    color: "#fbbf24",
    margin: "10px 0"
  },
  matchLabel: {
    color: "#9ca3af",
    fontSize: "14px"
  },
  moviesGrid: {
    margin: "20px 0"
  },
  moviesTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#fbbf24",
    margin: "10px 0"
  },
  moviesList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
    gap: "10px"
  },
  movieItem: {
    background: "#111",
    border: "1px solid #374151",
    borderRadius: "8px",
    padding: "12px 10px",
    textAlign: "center",
    color: "#d1d5db",
    fontSize: "12px",
    wordWrap: "break-word"
  }
};

const cssStyles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .matcher-step {
    animation: fadeIn 0.3s ease-in;
  }

  input:focus {
    outline: none;
    border-color: #fbbf24 !important;
  }

  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
  }

  @media (max-width: 768px) {
    .movie-matcher-container {
      padding: 10px;
    }
  }
`;

export default MovieMatcher;
