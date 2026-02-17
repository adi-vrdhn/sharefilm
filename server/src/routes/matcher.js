const express = require("express");
const { User, UserTasteProfile, UserMovieProfile } = require("../models");
const { calculateMatchScore, getMatchingMovies, getFriendRecommendations } = require("../services/movieMatcher");
const { getMoviesByPreference } = require("../services/tmdb");

const router = express.Router();

// POST: Get 15 movies based on user preferences
router.post("/matcher/get-movies-by-preference", async (req, res) => {
  try {
    const { languages, preference, genres } = req.body;

    if (!languages || !Array.isArray(languages) || languages.length === 0) {
      return res.status(400).json({ message: "Select at least one language" });
    }

    if (!preference || !["blockbuster", "niche", "mixed"].includes(preference)) {
      return res.status(400).json({ message: "Invalid preference: blockbuster, niche, or mixed" });
    }

    if (!genres || !Array.isArray(genres) || genres.length === 0) {
      return res.status(400).json({ message: "Select at least one genre" });
    }

    console.log(`[MATCHER] Fetching movies for user ${req.user?.id}:`, {
      languages,
      preference,
      genres
    });

    const movies = await getMoviesByPreference(languages, preference, genres);

    if (movies.length < 15) {
      console.warn(`[MATCHER] Only found ${movies.length} movies, expected 15`);
    }

    return res.json({
      message: "Movies fetched successfully",
      count: movies.length,
      movies
    });
  } catch (error) {
    console.error("[MATCHER] Error fetching movies:", error.message);
    return res.status(500).json({
      message: "Failed to fetch movies",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// POST: Create/Update taste profile
router.post("/matcher/taste-profile", async (req, res) => {
  try {
    const { preferredLanguages, movieRangePreference } = req.body;

    if (!preferredLanguages || preferredLanguages.length === 0) {
      return res.status(400).json({ message: "Select at least one language" });
    }

    const [profile] = await UserTasteProfile.findOrCreate({
      where: { userId: req.user.id },
      defaults: {
        userId: req.user.id,
        preferredLanguages,
        movieRangePreference: movieRangePreference || "mixed"
      }
    });

    // Update if exists
    if (profile.preferredLanguages !== preferredLanguages) {
      await profile.update({
        preferredLanguages,
        movieRangePreference: movieRangePreference || "mixed"
      });
    }

    return res.json({ message: "Taste profile saved", profile });
  } catch (error) {
    console.error("Error saving taste profile:", error.message);
    return res.status(500).json({ message: "Failed to save taste profile" });
  }
});

// POST: Add movies to profile (MINIMUM 5 MOVIES)
router.post("/matcher/add-movies", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { movies } = req.body;

    if (!movies || !Array.isArray(movies)) {
      return res.status(400).json({ message: "Movies must be an array" });
    }

    if (movies.length < 5) {
      return res.status(400).json({
        message: `Select at least 5 movies (${movies.length}/5)`
      });
    }

    // Validate movie structure
    const validMovies = movies.every(m => m.tmdb_id && m.title);
    if (!validMovies) {
      return res.status(400).json({ message: "Each movie must have tmdb_id and title" });
    }

    console.log(`Saving ${movies.length} movies for user ${req.user.id}`);

    const [profile, created] = await UserMovieProfile.findOrCreate({
      where: { userId: req.user.id },
      defaults: {
        userId: req.user.id,
        movies
      }
    });

    // Update if profile already exists
    if (!created) {
      await profile.update({ movies });
    }

    console.log(`Successfully saved movies for user ${req.user.id}`);

    return res.json({
      message: "Movies saved successfully",
      movieCount: movies.length,
      profile
    });
  } catch (error) {
    console.error("Error saving movies:", error.message, error.stack);
    return res.status(500).json({
      message: "Failed to save movies",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// GET: Get user's movie profile
router.get("/matcher/profile", async (req, res) => {
  try {
    const profile = await UserMovieProfile.findOne({ where: { userId: req.user.id } });
    return res.json(profile || {});
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// DELETE: Remove movie from profile
router.delete("/matcher/movie/:movieId", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { movieId } = req.params;
    const profile = await UserMovieProfile.findOne({ where: { userId: req.user.id } });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    profile.movies = profile.movies.filter(m => m.tmdb_id !== movieId);
    await profile.save();

    return res.json({ message: "Movie removed", profile });
  } catch (error) {
    console.error("Error removing movie:", error.message);
    return res.status(500).json({ message: "Failed to remove movie" });
  }
});

// POST: Calculate match with friend - REFINED ALGORITHM
router.post("/matcher/calculate-match/:friendId", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const friendId = parseInt(req.params.friendId);

    if (!friendId || isNaN(friendId)) {
      return res.status(400).json({ message: "Invalid friend ID" });
    }

    console.log(`Calculating match between user ${req.user.id} and friend ${friendId}`);

    const friend = await User.findByPk(friendId);
    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    const userProfile = await UserMovieProfile.findOne({ where: { userId: req.user.id } });
    if (!userProfile?.movies || userProfile.movies.length === 0) {
      return res.status(400).json({ message: "You must select movies first" });
    }

    const friendProfile = await UserMovieProfile.findOne({ where: { userId: friendId } });
    if (!friendProfile?.movies || friendProfile.movies.length === 0) {
      return res.status(400).json({ message: "Friend hasn't selected movies yet" });
    }

    console.log(`User ${req.user.id} has ${userProfile.movies.length} movies`);
    console.log(`Friend ${friendId} has ${friendProfile.movies.length} movies`);

    const matchScore = await calculateMatchScore(req.user.id, friendId);
    const matchingMovies = await getMatchingMovies(req.user.id, friendId);
    const recommendations = await getFriendRecommendations(req.user.id, friendId);

    console.log(`Match calculated: ${matchScore}%, Common movies: ${matchingMovies.length}, Recommendations: ${recommendations.length}`);

    return res.json({
      friend: {
        id: friend.id,
        name: friend.name,
        profilePicture: friend.profilePicture
      },
      matchScore,
      matchingMovies,
      recommendations,
      matchPercentage: `${matchScore}%`
    });
  } catch (error) {
    console.error("Error calculating match:", error.message, error.stack);
    return res.status(500).json({
      message: "Failed to calculate match",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

module.exports = router;
