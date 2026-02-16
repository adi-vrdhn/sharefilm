/**
 * Taste Match Routes
 * API endpoints for Movie Taste Match feature
 */

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { MovieTasteRating, UserMovie } = require("../models");
const tasteMatchService = require("../services/tasteMatchService");
const tasteMatchSessionService = require("../services/tasteMatchSessionService");
const tmdbMovieFetcher = require("../services/tmdbMovieFetcher");

/**
 * POST /api/taste-match/rate/:friendId
 * Record a user's rating for a movie (MY TYPE or Nahhh)
 * Tracks voting session with friend
 */
router.post("/api/taste-match/rate/:friendId", auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    const { tmdb_movie_id, rating, movie_title, genres, popularity } = req.body;

    if (!friendId || isNaN(friendId)) {
      return res.status(400).json({ error: "Invalid friend ID" });
    }

    if (!tmdb_movie_id) {
      return res.status(400).json({ error: "Movie ID is required" });
    }

    if (![1, -1].includes(rating)) {
      return res.status(400).json({ error: "Rating must be 1 (MY TYPE) or -1 (Nahhh)" });
    }

    // Check if already rated
    const existing = await MovieTasteRating.findOne({
      where: {
        user_id: req.user.id,
        tmdb_movie_id
      }
    });

    let result;
    if (existing) {
      // Update existing rating
      result = await existing.update({
        rating,
        movie_title,
        genres,
        popularity
      });
    } else {
      // Create new rating
      result = await MovieTasteRating.create({
        user_id: req.user.id,
        tmdb_movie_id,
        rating,
        movie_title,
        genres,
        popularity
      });
    }

    // Track vote in session
    const session = await tasteMatchSessionService.trackVote(req.user.id, parseInt(friendId));

    // Invalidate cached taste vector
    await tasteMatchService.invalidateTasteVector(req.user.id);

    res.json({
      success: true,
      message: existing ? "Rating updated" : "Rating saved",
      rating: result,
      session_status: session.session_status
    });
  } catch (error) {
    console.error("Error saving taste rating:", error);
    res.status(500).json({ error: "Failed to save rating" });
  }
});

/**
 * GET /api/taste-match/next-movie/:friendId
 * Get next movie for taste matching based on friend's preferences
 * If friend has < 20 movies: show popular movies (all genres)
 * If friend has >= 20 movies: show movies matching friend's top genres
 * Always excludes current user's watched + rated movies
 */
router.get("/api/taste-match/next-movie/:friendId", auth, async (req, res) => {
  try {
    const { friendId } = req.params;

    if (!friendId || isNaN(friendId)) {
      return res.status(400).json({ error: "Invalid friend ID" });
    }

    // Get next movie using friend's preference-based logic
    const movie = await tmdbMovieFetcher.getNextMovieForTasteMatchWithFriend(
      req.user.id,
      parseInt(friendId),
      MovieTasteRating,
      UserMovie
    );

    if (!movie) {
      return res.status(404).json({
        error: "No more movies available",
        message: "Try adjusting filters or check back later"
      });
    }

    res.json(movie);
  } catch (error) {
    console.error("Error getting next movie:", error);
    res.status(500).json({ error: "Failed to fetch movie" });
  }
});

/**
 * GET /api/taste-match/session/:friendId
 * Get current session state (voting, waiting, report ready)
 */
router.get("/api/taste-match/session/:friendId", auth, async (req, res) => {
  try {
    const { friendId } = req.params;

    if (!friendId || isNaN(friendId)) {
      return res.status(400).json({ error: "Invalid friend ID" });
    }

    const state = await tasteMatchSessionService.getSessionState(
      req.user.id,
      parseInt(friendId)
    );

    res.json(state);
  } catch (error) {
    console.error("Error getting session state:", error);
    res.status(500).json({ error: "Failed to get session state" });
  }
});

/**
 * GET /api/taste-match/compare/:friendId
 * Calculate taste match between current user and a friend
 */
router.get("/api/taste-match/compare/:friendId", auth, async (req, res) => {
  try {
    const { friendId } = req.params;

    if (!friendId || isNaN(friendId)) {
      return res.status(400).json({ error: "Invalid friend ID" });
    }

    const result = await tasteMatchService.calculateTasteMatch(
      req.user.id,
      parseInt(friendId),
      MovieTasteRating
    );

    res.json(result);
  } catch (error) {
    console.error("Error calculating taste match:", error);
    res.status(500).json({ error: "Failed to calculate match" });
  }
});

/**
 * GET /api/taste-match/user-stats
 * Get user's taste statistics
 */
router.get("/api/taste-match/user-stats", auth, async (req, res) => {
  try {
    const ratings = await MovieTasteRating.findAll({
      where: { user_id: req.user.id }
    });

    const likes = ratings.filter((r) => r.rating === 1).length;
    const dislikes = ratings.filter((r) => r.rating === -1).length;
    const total = ratings.length;

    // Get genre breakdown
    const genreCount = {};
    for (const rating of ratings) {
      if (rating.genres) {
        for (const genre of rating.genres) {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        }
      }
    }

    res.json({
      total_rated: total,
      likes,
      dislikes,
      genre_breakdown: genreCount,
      ready_for_matching: total >= tasteMatchService.MINIMUM_RATED_MOVIES
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

/**
 * POST /api/taste-match/build-vector
 * Manually trigger taste vector recalculation and caching
 */
router.post("/api/taste-match/build-vector", auth, async (req, res) => {
  try {
    const tasteData = await require("../services/tasteVectorService")
      .buildCompleteTasteVector(req.user.id, MovieTasteRating);

    if (tasteData.totalRatedMovies < tasteMatchService.MINIMUM_RATED_MOVIES) {
      return res.status(400).json({
        error: "Not enough data",
        ratings: tasteData.totalRatedMovies,
        required: tasteMatchService.MINIMUM_RATED_MOVIES
      });
    }

    await tasteMatchService.saveTasteVector(req.user.id, tasteData);

    res.json({
      success: true,
      vector: tasteData.vector,
      genres_count: tasteData.genresCount,
      total_rated: tasteData.totalRatedMovies
    });
  } catch (error) {
    console.error("Error building taste vector:", error);
    res.status(500).json({ error: "Failed to build vector" });
  }
});

module.exports = router;
