require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const sequelize = require("./config/db");
require("./models");

const authRoutes = require("./routes/auth");
const movieRoutes = require("./routes/movies");
const notificationRoutes = require("./routes/notifications");
const friendRoutes = require("./routes/friends");
const messageRoutes = require("./routes/messages");
const sharedPartyRoutes = require("./routes/sharedParty");
const profileRoutes = require("./routes/profile");
const analyticsRoutes = require("./routes/analytics");
const gamesRoutes = require("./routes/games");
const matcherRoutes = require("./routes/matcher");
const tasteRoutes = require("./routes/taste");
const authMiddleware = require("./middleware/auth");
const { initializeSocket } = require("./services/socket");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (process.env.CLIENT_ORIGIN || "").split(",").map((origin) => origin.trim()).filter(Boolean),
    credentials: true
  }
});

// Make io accessible to routes
app.locals.io = io;

const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Debug endpoint to check configuration
app.get("/debug/config", (req, res) => {
  res.json({
    tmdb_api_key_configured: !!process.env.TMDB_API_KEY,
    tmdb_api_key_length: process.env.TMDB_API_KEY ? process.env.TMDB_API_KEY.length : 0,
    node_env: process.env.NODE_ENV,
    port: process.env.PORT || 4000
  });
});

app.use("/auth", authRoutes);

// Public search endpoint (no auth required)
app.get("/search-movies", async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        message: "Search query must be at least 2 characters",
        movies: []
      });
    }

    console.log(`[SEARCH] Query: "${query}"`);
    
    // Test TMDB API key first
    if (!process.env.TMDB_API_KEY) {
      console.error("[SEARCH] TMDB_API_KEY is not set!");
      return res.status(500).json({ 
        message: "Server configuration error: TMDB API key not set",
        movies: [],
        error: "TMDB_API_KEY missing"
      });
    }

    const { searchMovies } = require("./services/tmdb");
    const results = await searchMovies(query);
    
    console.log(`[SEARCH] Returning ${results.length} results for "${query}"`);
    console.log(`[SEARCH] Sample result:`, results[0]);
    
    return res.json({ 
      movies: results,
      count: results.length
    });
  } catch (error) {
    console.error("[SEARCH] Error:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
    if (error.message.includes("TMDB_API_KEY")) {
      return res.status(500).json({ 
        message: "Server configuration error: TMDB API key not set",
        error: error.message,
        movies: []
      });
    }
    
    // Check for specific TMDB API errors
    if (error.response?.status === 401) {
      return res.status(500).json({ 
        message: "TMDB API key is invalid",
        error: "Authentication failed",
        movies: []
      });
    }
    
    return res.status(500).json({ 
      message: "Failed to search movies",
      error: error.message,
      movies: []
    });
  }
});

// Public endpoint to get movie details with crew (directors, cast)
app.get("/movie-details/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        message: "Invalid movie ID",
        directors: [],
        cast: [],
        genre_names: []
      });
    }

    console.log(`[MOVIE-DETAILS] Fetching details for movie ID: ${id}`);
    
    if (!process.env.TMDB_API_KEY) {
      console.error("[MOVIE-DETAILS] TMDB_API_KEY is not set!");
      return res.status(500).json({ 
        message: "Server configuration error",
        directors: [],
        cast: [],
        genre_names: []
      });
    }

    const { getMovieDetailsWithCrew } = require("./services/tmdb");
    const details = await getMovieDetailsWithCrew(id);
    
    console.log(`[MOVIE-DETAILS] Got details for: ${details.title}`);
    
    return res.json(details);
  } catch (error) {
    console.error("[MOVIE-DETAILS] Error:", error.message);
    
    return res.status(500).json({ 
      message: "Failed to fetch movie details",
      error: error.message,
      directors: [],
      cast: [],
      genre_names: []
    });
  }
});

// Public endpoint for smart suggestions
app.get("/smart-suggestions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        message: "Invalid movie ID",
        suggestions: []
      });
    }

    console.log(`[SMART-SUGGESTIONS] Fetching suggestions for movie ID: ${id}`);
    
    if (!process.env.TMDB_API_KEY) {
      console.error("[SMART-SUGGESTIONS] TMDB_API_KEY is not set!");
      return res.status(500).json({ 
        message: "Server configuration error",
        suggestions: []
      });
    }

    const { getSmartSuggestions } = require("./services/tmdb");
    const suggestions = await getSmartSuggestions(id);
    
    console.log(`[SMART-SUGGESTIONS] Got ${suggestions.length} suggestions`);
    
    return res.json({ 
      suggestions,
      count: suggestions.length
    });
  } catch (error) {
    console.error("[SMART-SUGGESTIONS] Error:", error.message);
    
    return res.status(500).json({ 
      message: "Failed to fetch suggestions",
      error: error.message,
      suggestions: []
    });
  }
});

// Public endpoint for smart suggestions based on entire profile
app.post("/smart-suggestions/profile", async (req, res) => {
  try {
    const { movieIds } = req.body;
    
    if (!Array.isArray(movieIds) || movieIds.length === 0) {
      return res.status(400).json({ 
        message: "Invalid movie IDs - must be non-empty array",
        suggestions: []
      });
    }

    // Validate all IDs are numbers
    if (!movieIds.every(id => !isNaN(id))) {
      return res.status(400).json({
        message: "All movie IDs must be valid numbers",
        suggestions: []
      });
    }

    console.log(`[PROFILE-SUGGESTIONS] Fetching suggestions for profile with ${movieIds.length} movies`);
    
    if (!process.env.TMDB_API_KEY) {
      console.error("[PROFILE-SUGGESTIONS] TMDB_API_KEY is not set!");
      return res.status(500).json({ 
        message: "Server configuration error",
        suggestions: []
      });
    }

    const { getSmartSuggestionsForProfile } = require("./services/tmdb");
    const suggestions = await getSmartSuggestionsForProfile(movieIds);
    
    console.log(`[PROFILE-SUGGESTIONS] Got ${suggestions.length} suggestions`);
    
    return res.json({ 
      suggestions,
      count: suggestions.length
    });
  } catch (error) {
    console.error("[PROFILE-SUGGESTIONS] Error:", error.message);
    
    return res.status(500).json({ 
      message: "Failed to fetch profile suggestions",
      error: error.message,
      suggestions: []
    });
  }
});

// Public endpoint for advanced similar movie recommendations
app.post("/smart-suggestions/similar/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        message: "Invalid movie ID",
        suggestions: []
      });
    }

    console.log(`[SIMILAR-ADVANCED] Fetching advanced similar movies for movie ID: ${id}`);
    
    if (!process.env.TMDB_API_KEY) {
      console.error("[SIMILAR-ADVANCED] TMDB_API_KEY is not set!");
      return res.status(500).json({ 
        message: "Server configuration error",
        suggestions: []
      });
    }

    const { getSmartSuggestions, getMovieDetailsWithCrew } = require("./services/tmdb");
    const { MovieVector, scoreSimilarMovie } = require("./services/movieEvaluation");
    const suggestions = await getSmartSuggestions(id);
    
    // Get reference movie details for enhanced scoring
    let referenceMovieDetails = null;
    try {
      referenceMovieDetails = await getMovieDetailsWithCrew(id);
    } catch (err) {
      console.warn("[SIMILAR-ADVANCED] Could not fetch reference movie details, using basic scores");
    }
    
    let enhancedSuggestions = suggestions;
    
    if (referenceMovieDetails) {
      const referenceVector = new MovieVector({
        id: referenceMovieDetails.tmdb_id,
        title: referenceMovieDetails.title,
        vote_average: referenceMovieDetails.rating,
        popularity: referenceMovieDetails.popularity,
        release_date: referenceMovieDetails.release_date,
        genre_ids: referenceMovieDetails.genres || [],
        directors: referenceMovieDetails.directors || [],
        cast: referenceMovieDetails.cast || [],
        keywords: referenceMovieDetails.keywords || []
      });

      // Score each suggestion using similarity formula
      enhancedSuggestions = suggestions.map(suggestion => {
        const suggestionVector = new MovieVector({
          id: suggestion.tmdb_id,
          title: suggestion.title,
          vote_average: suggestion.vote_average,
          popularity: suggestion.popularity,
          release_date: suggestion.release_date,
          genre_ids: suggestion.genre_ids || [],
          directors: suggestion.directors || [],
          cast: suggestion.cast || [],
          keywords: suggestion.keywords || []
        });

        const similarityScoring = scoreSimilarMovie(suggestionVector, referenceVector);
        return {
          ...suggestion,
          advancedScore: similarityScoring.score,
          scoreBreakdown: similarityScoring.breakdown
        };
      }).sort((a, b) => b.advancedScore - a.advancedScore);
    }

    console.log(`[SIMILAR-ADVANCED] Returning ${enhancedSuggestions.slice(0, limit).length} enhanced suggestions`);
    
    return res.json({ 
      suggestions: enhancedSuggestions.slice(0, limit),
      count: enhancedSuggestions.length,
      referenceMovie: referenceMovieDetails ? {
        id: referenceMovieDetails.tmdb_id,
        title: referenceMovieDetails.title,
        rating: referenceMovieDetails.rating,
        popularity: referenceMovieDetails.popularity,
        directors: referenceMovieDetails.directors,
        cast: referenceMovieDetails.cast
      } : null
    });
  } catch (error) {
    console.error("[SIMILAR-ADVANCED] Error:", error.message);
    
    return res.status(500).json({ 
      message: "Failed to fetch advanced similar suggestions",
      error: error.message,
      suggestions: []
    });
  }
});

// Games routes (no auth required, public endpoints)
app.use(gamesRoutes);

// Serve static files from React build BEFORE auth middleware
const buildPath = path.join(__dirname, "../../client/dist");
app.use(express.static(buildPath));

// Apply auth middleware only to API routes
app.use(authMiddleware);
app.use(movieRoutes);
app.use(matcherRoutes);
app.use(tasteRoutes);
app.use(notificationRoutes);
app.use(friendRoutes);
app.use(messageRoutes);
app.use(sharedPartyRoutes);
app.use(profileRoutes);
app.use("/analytics", analyticsRoutes);

// SPA fallback: serve index.html for any non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

// Initialize Socket.io
initializeSocket(io);

const start = async () => {
  try {
    await sequelize.authenticate();
    // Use alter: true temporarily to update SharedParty table schema
    await sequelize.sync({ alter: true });

    const port = process.env.PORT || 4000;
    server.listen(port, () => {
      console.log(`Server running on ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

start();
