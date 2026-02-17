const express = require("express");
const { UserTasteMovie } = require("../models");
const { getMovieDetails } = require("../services/tmdb");
const { calculateMatchPercentage, findSimilarMovies, getUserTasteMovies } = require("../services/tasteMatching");

const router = express.Router();

// POST: Add movie to user's taste
router.post("/taste/add-movie", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { tmdb_id, title, poster_path, year, overview, genres, genre_names, directors, cast, vote_average, popularity, release_date } = req.body;

    if (!tmdb_id || !title) {
      return res.status(400).json({ message: "tmdb_id and title are required" });
    }

    // Check if movie already exists in user's taste
    const existing = await UserTasteMovie.findOne({
      where: { userId: req.user.id, tmdb_id }
    });

    if (existing) {
      return res.status(400).json({ message: "Movie already in your taste" });
    }

    // Create new taste movie
    const movie = await UserTasteMovie.create({
      userId: req.user.id,
      tmdb_id,
      title,
      poster_path,
      year,
      overview,
      genres: genres || [],
      genre_names: genre_names || [],
      directors: directors || [],
      cast: cast || [],
      vote_average: vote_average || 0,
      popularity: popularity || 0,
      release_date
    });

    console.log(`[TASTE] Added movie ${title} to user ${req.user.id}'s taste`);

    return res.status(201).json({
      message: "Movie added to your taste",
      movie
    });
  } catch (error) {
    console.error("[TASTE] Error adding movie:", error.message);
    return res.status(500).json({
      message: "Failed to add movie to taste"
    });
  }
});

// GET: Get user's taste movies
router.get("/taste/my-movies", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const movies = await UserTasteMovie.findAll({
      where: { userId: req.user.id },
      raw: true,
      order: [["createdAt", "DESC"]]
    });

    return res.json({
      count: movies.length,
      movies
    });
  } catch (error) {
    console.error("[TASTE] Error fetching taste movies:", error.message);
    return res.status(500).json({ message: "Failed to fetch taste movies" });
  }
});

// DELETE: Remove movie from user's taste
router.delete("/taste/remove-movie/:tmdb_id", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { tmdb_id } = req.params;

    const deleted = await UserTasteMovie.destroy({
      where: { userId: req.user.id, tmdb_id: parseInt(tmdb_id) }
    });

    if (deleted === 0) {
      return res.status(404).json({ message: "Movie not found in your taste" });
    }

    console.log(`[TASTE] Removed movie ${tmdb_id} from user ${req.user.id}'s taste`);

    return res.json({ message: "Movie removed from your taste" });
  } catch (error) {
    console.error("[TASTE] Error removing movie:", error.message);
    return res.status(500).json({ message: "Failed to remove movie" });
  }
});

// GET: Calculate match with a friend
router.get("/taste/match/:friendId", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { friendId } = req.params;

    // Get both users' taste movies
    const currentUserMovies = await UserTasteMovie.findAll({
      where: { userId: req.user.id },
      raw: true
    });

    const friendMovies = await UserTasteMovie.findAll({
      where: { userId: parseInt(friendId) },
      raw: true
    });

    // Check if both have taste
    if (currentUserMovies.length === 0 || friendMovies.length === 0) {
      return res.status(400).json({
        message: "Sorry, both users must have added movies to their taste",
        currentUserMovieCount: currentUserMovies.length,
        friendMovieCount: friendMovies.length
      });
    }

    // Calculate match percentage
    const matchPercentage = calculateMatchPercentage(currentUserMovies, friendMovies);

    // Find similar movies
    const similarMovies = findSimilarMovies(currentUserMovies, friendMovies);

    console.log(`[TASTE] Match calculated: ${req.user.id} vs ${friendId} = ${matchPercentage}%`);

    return res.json({
      matchPercentage,
      currentUserMovieCount: currentUserMovies.length,
      friendMovieCount: friendMovies.length,
      similarMoviesCount: similarMovies.length,
      similarMovies: similarMovies.slice(0, 10) // Return top 10 similar movies
    });
  } catch (error) {
    console.error("[TASTE] Error calculating match:", error.message);
    return res.status(500).json({ message: "Failed to calculate match" });
  }
});

module.exports = router;
