require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const sequelize = require("./config/db");
require("./models");

// 🔒 Security middleware imports
const { securityHeaders, generalLimiter, authLimiter, searchLimiter } = require("./middleware/security");
const { sanitizeInput } = require("./middleware/sanitization");

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
const recommendationsRoutes = require("./routes/recommendations");
const authMiddleware = require("./middleware/auth");
const { initializeSocket } = require("./services/socket");

// Define allowed origins BEFORE creating server
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(null, true); // Allow temporarily for debugging
    },
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});

// Make io accessible to routes
app.locals.io = io;

// 🔒 SECURITY FIRST: Apply helmet and rate limiting early
app.use(securityHeaders);
app.use(generalLimiter);

// CORS configuration - Enhanced for production
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if origin is in whitelist
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // For debugging - log rejected origins
      console.warn(`[CORS] Rejected origin: ${origin}`);
      console.warn(`[CORS] Allowed origins: ${allowedOrigins.join(", ") || "NONE SET"}`);
      
      callback(null, true); // Temporarily allow all for debugging
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400
  })
);

// Body parser with request size limits (prevent large payloads)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

// 🔒 Sanitize all user input
app.use(sanitizeInput);

// ============================================
// PUBLIC ENDPOINTS (no authentication)
// ============================================

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Public search endpoint with rate limiting
app.get("/search-movies", searchLimiter, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        message: "Search query must be at least 2 characters",
        movies: []
      });
    }

    // Sanitize query
    const sanitizedQuery = query.trim().substring(0, 100);
    
    if (!process.env.TMDB_API_KEY) {
      console.error("[SEARCH] TMDB_API_KEY not configured");
      return res.status(500).json({ 
        message: "Search service temporarily unavailable",
        movies: []
      });
    }

    const { searchMovies } = require("./services/tmdb");
    const results = await searchMovies(sanitizedQuery);
    
    return res.json({ 
      movies: results,
      count: results.length
    });
  } catch (error) {
    console.error("[SEARCH] Error:", error.message);
    // Generic error message - don't expose internal details
    return res.status(500).json({ 
      message: "Search failed. Please try again.",
      movies: []
    });
  }
});

// Public endpoint to get movie details
app.get("/movie-details/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID is a positive integer
    if (!id ||isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({ 
        message: "Invalid movie ID",
        directors: [],
        cast: [],
        genre_names: []
      });
    }

    if (!process.env.TMDB_API_KEY) {
      console.error("[MOVIE-DETAILS] TMDB_API_KEY not configured");
      return res.status(500).json({ 
        message: "Service temporarily unavailable",
        directors: [],
        cast: [],
        genre_names: []
      });
    }

    const { getMovieDetailsWithCrew } = require("./services/tmdb");
    const details = await getMovieDetailsWithCrew(id);
    
    return res.json(details);
  } catch (error) {
    console.error("[MOVIE-DETAILS] Error:", error.message);
    return res.status(500).json({ 
      message: "Failed to fetch movie details",
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
    
    if (!id || isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({ 
        message: "Invalid movie ID",
        suggestions: []
      });
    }

    if (!process.env.TMDB_API_KEY) {
      console.error("[SMART-SUGGESTIONS] TMDB_API_KEY not configured");
      return res.status(500).json({ 
        message: "Service temporarily unavailable",
        suggestions: []
      });
    }

    const { getSmartSuggestions } = require("./services/tmdb");
    const suggestions = await getSmartSuggestions(id);
    
    return res.json({ 
      suggestions,
      count: suggestions.length
    });
  } catch (error) {
    console.error("[SMART-SUGGESTIONS] Error:", error.message);
    return res.status(500).json({ 
      message: "Failed to fetch suggestions",
      suggestions: []
    });
  }
});

// Public endpoint for smart suggestions based on profile
app.post("/smart-suggestions/profile", async (req, res) => {
  try {
    const { movieIds } = req.body;
    
    if (!Array.isArray(movieIds) || movieIds.length === 0) {
      return res.status(400).json({ 
        message: "Invalid request",
        suggestions: []
      });
    }

    // Validate all IDs are positive integers
    if (!movieIds.every(id => Number.isInteger(id) && id > 0)) {
      return res.status(400).json({
        message: "Invalid movie IDs",
        suggestions: []
      });
    }

    // Limit to prevent abuse
    if (movieIds.length > 100) {
      return res.status(400).json({
        message: "Maximum 100 movies allowed",
        suggestions: []
      });
    }

    if (!process.env.TMDB_API_KEY) {
      console.error("[PROFILE-SUGGESTIONS] TMDB_API_KEY not configured");
      return res.status(500).json({ 
        message: "Service temporarily unavailable",
        suggestions: []
      });
    }

    const { getSmartSuggestionsForProfile } = require("./services/tmdb");
    const suggestions = await getSmartSuggestionsForProfile(movieIds);
    
    return res.json({ 
      suggestions,
      count: suggestions.length
    });
  } catch (error) {
    console.error("[PROFILE-SUGGESTIONS] Error:", error.message);
    return res.status(500).json({ 
      message: "Failed to fetch suggestions",
      suggestions: []
    });
  }
});

// Public endpoint for advanced similar movie recommendations
app.post("/smart-suggestions/similar/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.body;
    
    if (!id || isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({ 
        message: "Invalid movie ID",
        suggestions: []
      });
    }

    // Validate limit
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      return res.status(400).json({
        message: "Invalid limit parameter",
        suggestions: []
      });
    }

    if (!process.env.TMDB_API_KEY) {
      console.error("[SIMILAR-ADVANCED] TMDB_API_KEY not configured");
      return res.status(500).json({ 
        message: "Service temporarily unavailable",
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
      console.warn("[SIMILAR-ADVANCED] Could not fetch reference movie details");
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

      // Score each suggestion
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
      message: "Failed to fetch suggestions",
      suggestions: []
    });
  }
});

// Games routes (public)
app.use(gamesRoutes);

// Serve static files from React build BEFORE auth middleware
const buildPath = path.join(__dirname, "../../client/dist");
app.use(express.static(buildPath));

// ============================================
// PROTECTED ENDPOINTS (require authentication)
// ============================================

// 🔒 Apply auth rate limiting and auth middleware
app.use("/auth", authLimiter);
app.use("/auth", authRoutes);

// Apply auth middleware only to API routes
app.use(authMiddleware);
app.use(movieRoutes);
app.use(matcherRoutes);
app.use(tasteRoutes);
app.use("/recommendations", recommendationsRoutes);
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

// Global error handler
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.message);
  
  // Don't expose internal error details
  return res.status(500).json({
    message: "An error occurred. Please try again."
  });
});

// Initialize Socket.io
initializeSocket(io);

const start = async () => {
  try {
    console.log("[DB] Attempting to authenticate with database...");
    await sequelize.authenticate();
    console.log("[DB] ✅ Database authentication successful");
    
    console.log("[DB] Syncing models...");
    await sequelize.sync({ alter: true });
    console.log("[DB] ✅ Database sync complete");

    const port = process.env.PORT || 4000;
    server.listen(port, () => {
      console.log(`🔒 Secure server running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Client origin: ${process.env.CLIENT_ORIGIN}`);
    });
  } catch (error) {
    console.error("[DB] ❌ Database connection failed:");
    console.error("[DB] Error type:", error.constructor.name);
    console.error("[DB] Error message:", error.message);
    console.error("[DB] Full error:", error);
    
    // Try to start server anyway with limited functionality
    console.log("[DB] ⚠️  Starting server in degraded mode (no database)");
    const port = process.env.PORT || 4000;
    server.listen(port, () => {
      console.log(`⚠️  Server running on port ${port} (database disconnected)`);
    });
  }
};

start();
