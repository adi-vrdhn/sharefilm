const express = require("express");
const axios = require("axios");
const authenticateToken = require("../middleware/auth");
const {
  getRecommendations,
  updateUserTaste,
  getSimilarMovies,
} = require("../services/recommendationEngine");

const router = express.Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

/**
 * GET /api/next-show/movies
 * Get movies for swiping with applied filters
 */
router.get("/movies", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { genres, languages, platforms, limit = 50 } = req.query;

    // Build TMDB discover URL with filters
    let tmdbUrl = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}`;
    tmdbUrl += `&language=en-US&sort_by=popularity.desc&include_adult=false`;

    // Add filters if they're not "any"
    if (genres && genres !== "any") {
      const genreIds = genres.split(",").filter(Boolean);
      if (genreIds.length > 0) {
        tmdbUrl += `&with_genres=${genreIds.join(",")}`;
      }
    }

    if (languages && languages !== "any") {
      const langCodes = languages.split(",").filter(Boolean);
      if (langCodes.length > 0) {
        tmdbUrl += `&with_original_language=${langCodes.join("|")}`;
      }
    }

    // Fetch movies from TMDB
    const response = await axios.get(tmdbUrl);
    const tmdbMovies = response.data.results || [];

    // Get additional details for each movie (cast, director, etc)
    const detailedMovies = await Promise.all(
      tmdbMovies.slice(0, parseInt(limit)).map(async (movie) => {
        try {
          const details = await axios.get(
            `${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}&append_to_response=credits`
          );

          // Extract director and cast
          const director = details.data.credits?.crew?.find(
            (c) => c.job === "Director"
          )?.name;
          const cast = details.data.credits?.cast?.slice(0, 5).map((c) => c.name);

          return {
            ...movie,
            director,
            cast,
            platform: platforms && platforms !== "any" ? platforms.split(",")[0] : null,
          };
        } catch {
          return {
            ...movie,
            director: null,
            cast: [],
            platform: null,
          };
        }
      })
    );

    res.json({
      success: true,
      data: {
        movies: detailedMovies,
        count: detailedMovies.length,
      },
    });
  } catch (error) {
    console.error("Error fetching NEXT SHOW movies:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch movies",
      error: error.message,
    });
  }
});

/**
 * POST /api/next-show/record-swipe
 * Record a swipe action and update user taste vector
 */
router.post("/record-swipe", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      tmdbId,
      movieTitle,
      action, // "watched", "interested", "passed"
      genres,
      language,
      director,
      cast,
      platform,
    } = req.body;

    // Record the swipe event
    const { SwipeEvent } = require("../models");
    await SwipeEvent.create({
      userId,
      tmdbId,
      action,
      movieTitle,
    });

    // Update user taste vector
    const movieData = {
      genres,
      language,
      director,
      cast,
      platform,
    };

    await updateUserTaste(userId, tmdbId, action, movieData);

    res.json({
      success: true,
      message: "Swipe recorded and taste updated",
      data: {
        action,
        recorded: true,
      },
    });
  } catch (error) {
    console.error("Error recording swipe:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record swipe",
      error: error.message,
    });
  }
});

/**
 * GET /api/next-show/similar-movies
 * Get similar movies for a given movie
 */
router.get("/similar-movies", authenticateToken, async (req, res) => {
  try {
    const { movieId, limit = 20 } = req.query;
    const userId = req.user.id;

    if (!movieId) {
      return res.status(400).json({
        success: false,
        message: "movieId parameter is required",
      });
    }

    // Get user's taste vector for personalized similarity
    const { UserTasteVector } = require("../models");
    const tasteVector = await UserTasteVector.findOne({
      where: { userId },
    });

    // Get similar movies
    const similarMovies = await getSimilarMovies(movieId, parseInt(limit), tasteVector);

    res.json({
      success: true,
      data: {
        similarMovies,
        count: similarMovies.length,
      },
    });
  } catch (error) {
    console.error("Error fetching similar movies:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch similar movies",
      error: error.message,
    });
  }
});

module.exports = router;
