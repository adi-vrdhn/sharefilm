const express = require("express");
const { UserTasteMovie } = require("../models");
const { getMovieDetails, getMovieDetailsWithCrew } = require("../services/tmdb");
const { calculateMatchPercentage, findSimilarMovies, getUserTasteMovies } = require("../services/tasteMatching");
const { MovieVector, UserTasteVector, cosineSimilarity, cosineToPercentage, scoreMovieForUser, scoreSimilarMovie } = require("../services/movieEvaluation");

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

// GET: Calculate advanced match with evaluation system
router.get("/taste/match-advanced/:friendId", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { friendId } = req.params;
    console.log(`[MATCH-ADVANCED] Calculating match between ${req.user.id} and ${friendId}`);

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
        message: "Both users must have added movies to their taste for advanced matching",
        currentUserMovieCount: currentUserMovies.length,
        friendMovieCount: friendMovies.length
      });
    }

    console.log(`[MATCH-ADVANCED] User1 has ${currentUserMovies.length} movies, User2 has ${friendMovies.length} movies`);

    // Create movie vectors for both users
    const user1MovieVectors = currentUserMovies.map(movie => 
      new MovieVector({
        id: movie.tmdb_id,
        title: movie.title,
        vote_average: movie.vote_average,
        popularity: movie.popularity,
        release_date: movie.release_date,
        genre_ids: movie.genres || [],
        directors: movie.directors || [],
        cast: movie.cast || [],
        keywords: movie.keywords || []
      })
    );

    const user2MovieVectors = friendMovies.map(movie =>
      new MovieVector({
        id: movie.tmdb_id,
        title: movie.title,
        vote_average: movie.vote_average,
        popularity: movie.popularity,
        release_date: movie.release_date,
        genre_ids: movie.genres || [],
        directors: movie.directors || [],
        cast: movie.cast || [],
        keywords: movie.keywords || []
      })
    );

    // Create user taste vectors
    const user1Taste = new UserTasteVector(user1MovieVectors);
    const user2Taste = new UserTasteVector(user2MovieVectors);

    console.log(`[MATCH-ADVANCED] User1 profile: ${user1Taste.tasteProfile.diversity} taste, rating ${user1Taste.tasteProfile.avgRating.toFixed(2)}, blockbuster bias ${user1Taste.tasteProfile.blockbusterBias.toFixed(2)}`);
    console.log(`[MATCH-ADVANCED] User2 profile: ${user2Taste.tasteProfile.diversity} taste, rating ${user2Taste.tasteProfile.avgRating.toFixed(2)}, blockbuster bias ${user2Taste.tasteProfile.blockbusterBias.toFixed(2)}`);

    // Calculate cosine similarity
    const cosine = cosineSimilarity(user1Taste.vector, user2Taste.vector);
    const compatibilityScore = cosineToPercentage(cosine);

    console.log(`[MATCH-ADVANCED] Cosine similarity: ${cosine.toFixed(4)}, Compatibility: ${compatibilityScore.toFixed(2)}%`);

    return res.json({
      compatibilityScore: Math.round(compatibilityScore),
      cosineRaw: cosine,
      currentUserMovieCount: currentUserMovies.length,
      friendMovieCount: friendMovies.length,
      currentUserProfile: user1Taste.tasteProfile,
      friendProfile: user2Taste.tasteProfile,
      compatibility: {
        score: Math.round(compatibilityScore),
        level: compatibilityScore > 80 ? "Perfect Match" : 
               compatibilityScore > 65 ? "Great Match" :
               compatibilityScore > 50 ? "Good Match" :
               compatibilityScore > 35 ? "Moderate Match" : "Casual Match",
        description: `You and your friend have ${
          user1Taste.tasteProfile.diversity === user2Taste.tasteProfile.diversity 
            ? "similar taste diversity" 
            : "different taste diversity"
        }. ${
          Math.abs(user1Taste.tasteProfile.avgRating - user2Taste.tasteProfile.avgRating) < 0.5
            ? "You prefer similar movie ratings."
            : "You have different preferences for movie ratings."
        } ${
          Math.abs(user1Taste.tasteProfile.blockbusterBias - user2Taste.tasteProfile.blockbusterBias) < 0.3
            ? "You both lean toward similar blockbuster/niche preferences."
            : "You have different preferences for blockbusters vs niche films."
        }`
      }
    });
  } catch (error) {
    console.error("[MATCH-ADVANCED] Error calculating match:", error.message);
    return res.status(500).json({ 
      message: "Failed to calculate advanced match",
      error: error.message
    });
  }
});

// POST: Get personalized recommendations based on user's taste profile
router.post("/taste/recommendations", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { candidateMovies, limit = 20 } = req.body;

    if (!Array.isArray(candidateMovies) || candidateMovies.length === 0) {
      return res.status(400).json({ message: "candidateMovies array is required" });
    }

    console.log(`[RECOMMENDATIONS] Getting recommendations for user ${req.user.id}, evaluating ${candidateMovies.length} candidates`);

    // Get user's taste movies
    const userMovies = await UserTasteMovie.findAll({
      where: { userId: req.user.id },
      raw: true
    });

    if (userMovies.length === 0) {
      return res.status(400).json({ 
        message: "User must have added movies to their taste profile",
        recommendations: []
      });
    }

    // Create user taste vector
    const userMovieVectors = userMovies.map(movie =>
      new MovieVector({
        id: movie.tmdb_id,
        title: movie.title,
        vote_average: movie.vote_average,
        popularity: movie.popularity,
        release_date: movie.release_date,
        genre_ids: movie.genres || [],
        directors: movie.directors || [],
        cast: movie.cast || [],
        keywords: movie.keywords || []
      })
    );

    const userTaste = new UserTasteVector(userMovieVectors);

    // Score each candidate movie
    const scoredMovies = candidateMovies
      .map(movie => {
        const movieVector = new MovieVector({
          id: movie.id,
          title: movie.title,
          vote_average: movie.vote_average,
          popularity: movie.popularity,
          release_date: movie.release_date,
          genre_ids: movie.genre_ids || [],
          directors: movie.directors || [],
          cast: movie.cast || [],
          keywords: movie.keywords || []
        });

        const scoring = scoreMovieForUser(movieVector, userTaste);
        return {
          ...movie,
          score: scoring.score,
          scoreBreakdown: scoring.breakdown,
          details: scoring.details
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    console.log(`[RECOMMENDATIONS] Generated ${scoredMovies.length} recommendations, top score: ${scoredMovies[0]?.score}`);

    return res.json({
      recommendations: scoredMovies,
      count: scoredMovies.length,
      userProfile: userTaste.tasteProfile
    });
  } catch (error) {
    console.error("[RECOMMENDATIONS] Error:", error.message);
    return res.status(500).json({
      message: "Failed to generate recommendations",
      error: error.message,
      recommendations: []
    });
  }
});

module.exports = router;
