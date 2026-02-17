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
    const { searchMovies } = require("./services/tmdb");
    const results = await searchMovies(query);
    
    console.log(`[SEARCH] Returning ${results.length} results for "${query}"`);
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

// Games routes (no auth required, public endpoints)
app.use(gamesRoutes);

// Serve static files from React build BEFORE auth middleware
const buildPath = path.join(__dirname, "../../client/dist");
app.use(express.static(buildPath));

// Apply auth middleware only to API routes
app.use(authMiddleware);
app.use(movieRoutes);
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
