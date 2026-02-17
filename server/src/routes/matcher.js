const express = require("express");
const { User, UserTasteProfile, UserMovieProfile } = require("../models");
const { calculateMatchScore, getMatchingMovies, getFriendRecommendations } = require("../services/movieMatcher");

const router = express.Router();

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

// POST: Add movies to profile
router.post("/matcher/add-movies", async (req, res) => {
  try {
    const { movies } = req.body;

    if (!movies || movies.length < 5) {
      return res.status(400).json({ message: "Select at least 5 movies" });
    }

    const [profile] = await UserMovieProfile.findOrCreate({
      where: { userId: req.user.id },
      defaults: {
        userId: req.user.id,
        movies
      }
    });

    // Update existing profile
    await profile.update({ movies });

    return res.json({ message: "Movies saved", profile });
  } catch (error) {
    console.error("Error saving movies:", error.message);
    return res.status(500).json({ message: "Failed to save movies" });
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
    const { movieId } = req.params;
    const profile = await UserMovieProfile.findOne({ where: { userId: req.user.id } });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    profile.movies = profile.movies.filter(m => m.id !== movieId);
    await profile.save();

    return res.json({ message: "Movie removed" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove movie" });
  }
});

// POST: Calculate match with friend
router.post("/matcher/calculate-match/:friendId", async (req, res) => {
  try {
    const friendId = parseInt(req.params.friendId);

    const friend = await User.findByPk(friendId);
    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    const friendProfile = await UserMovieProfile.findOne({ where: { userId: friendId } });
    if (!friendProfile?.movies || friendProfile.movies.length === 0) {
      return res.status(400).json({ message: "Friend hasn't selected movies yet" });
    }

    const matchScore = await calculateMatchScore(req.user.id, friendId);
    const matchingMovies = await getMatchingMovies(req.user.id, friendId);
    const recommendations = await getFriendRecommendations(req.user.id, friendId);

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
    console.error("Error calculating match:", error.message);
    return res.status(500).json({ message: "Failed to calculate match" });
  }
});

module.exports = router;
