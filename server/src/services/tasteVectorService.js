/**
 * Taste Vector Service
 * Builds and normalizes taste vectors from movie ratings and watched movies
 */

const { Movie, UserMovie } = require("../models");
const { sequelize } = require("../config/db");

/**
 * Build taste vector from watched movies
 * Watched movies contribute 0.5 weight (passive signal)
 * @param {Number} userId - User ID
 * @returns {Object} Taste vector with genres
 */
async function buildVectorFromWatched(userId) {
  try {
    const watchedMovies = await UserMovie.findAll({
      where: { user_id: userId },
      attributes: ["tmdb_id"]
    });

    const tasteVector = {};

    for (const watchedMovie of watchedMovies) {
      const movieDetails = await fetchMovieDetailsFromCache(watchedMovie.tmdb_id);
      if (movieDetails && movieDetails.genres) {
        for (const genre of movieDetails.genres) {
          tasteVector[genre] = (tasteVector[genre] || 0) + 0.5;
        }
      }
    }

    return tasteVector;
  } catch (error) {
    console.error("Error building vector from watched movies:", error);
    return {};
  }
}

/**
 * Build taste vector from active ratings (MY TYPE / Nahhh)
 * @param {Number} userId - User ID
 * @param {Object} MovieTasteRating - Model reference
 * @returns {Object} Taste vector
 */
async function buildVectorFromRatings(userId, MovieTasteRatingModel) {
  try {
    const ratings = await MovieTasteRatingModel.findAll({
      where: { user_id: userId }
    });

    const tasteVector = {};

    for (const rating of ratings) {
      const genres = rating.genres || [];
      const ratingValue = rating.rating; // 1 or -1

      for (const genre of genres) {
        // Optional: weight by popularity (less popular movies count more)
        let weight = ratingValue;
        if (rating.popularity > 0) {
          weight = ratingValue * (1 + 1 / rating.popularity);
        }

        tasteVector[genre] = (tasteVector[genre] || 0) + weight;
      }
    }

    return tasteVector;
  } catch (error) {
    console.error("Error building vector from ratings:", error);
    return {};
  }
}

/**
 * Combine multiple vectors
 * @param {...Object} vectors - Multiple taste vectors
 * @returns {Object} Combined vector
 */
function combineVectors(...vectors) {
  const combined = {};

  for (const vector of vectors) {
    if (!vector) continue;
    for (const [genre, value] of Object.entries(vector)) {
      combined[genre] = (combined[genre] || 0) + value;
    }
  }

  return combined;
}

/**
 * Normalize vector values to range [-1, 1]
 * @param {Object} vector - Taste vector
 * @returns {Object} Normalized vector
 */
function normalizeVector(vector) {
  const normalized = {};

  if (Object.keys(vector).length === 0) return normalized;

  // Find max absolute value
  let maxValue = 0;
  for (const value of Object.values(vector)) {
    maxValue = Math.max(maxValue, Math.abs(value));
  }

  if (maxValue === 0) return normalized;

  // Scale all values to [-1, 1]
  for (const [genre, value] of Object.entries(vector)) {
    normalized[genre] = value / maxValue;
  }

  return normalized;
}

/**
 * Build complete taste vector for a user
 * Combines watched movies + active ratings
 * @param {Number} userId - User ID
 * @param {Object} MovieTasteRating - Model reference
 * @returns {Object} {vector, totalRatedMovies}
 */
async function buildCompleteTasteVector(userId, MovieTasteRatingModel) {
  try {
    const watchedVector = await buildVectorFromWatched(userId);
    const ratedVector = await buildVectorFromRatings(userId, MovieTasteRatingModel);

    const combined = combineVectors(watchedVector, ratedVector);
    const normalized = normalizeVector(combined);

    // Count total active ratings
    const totalRatings = await MovieTasteRatingModel.count({
      where: { user_id: userId }
    });

    return {
      vector: normalized,
      totalRatedMovies: totalRatings,
      genresCount: Object.keys(normalized).length
    };
  } catch (error) {
    console.error("Error building complete taste vector:", error);
    return {
      vector: {},
      totalRatedMovies: 0,
      genresCount: 0
    };
  }
}

/**
 * Cache movie details to avoid repeated TMDB lookups
 * @param {Number} tmdbId - TMDB movie ID
 * @returns {Object} Movie details with genres
 */
async function fetchMovieDetailsFromCache(tmdbId) {
  try {
    // Check if we have genres cached in MovieTasteRating table
    // In real implementation, you might use Redis or similar
    return null; // For now, return null to trigger fresh TMDB fetch
  } catch (error) {
    return null;
  }
}

module.exports = {
  buildVectorFromWatched,
  buildVectorFromRatings,
  combineVectors,
  normalizeVector,
  buildCompleteTasteVector,
  fetchMovieDetailsFromCache
};
