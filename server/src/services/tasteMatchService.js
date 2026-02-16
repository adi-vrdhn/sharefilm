/**
 * Taste Match Service
 * Main orchestrator for taste matching feature
 */

const { UserTasteVector } = require("../models");
const tasteVectorService = require("./tasteVectorService");
const similarityService = require("./similarityService");
const tmdbMovieFetcher = require("./tmdbMovieFetcher");

// Users must vote on 20 movies to generate a match report
const MINIMUM_RATED_MOVIES = 20;

/**
 * Calculate taste match between two users
 * @param {Number} userId1 - First user ID
 * @param {Number} userId2 - Second user ID
 * @param {Object} MovieTasteRatingModel - Database model
 * @returns {Object} Match result with percentage and breakdown
 */
async function calculateTasteMatch(userId1, userId2, MovieTasteRatingModel) {
  try {
    // Build taste vectors for both users
    const result1 = await tasteVectorService.buildCompleteTasteVector(
      userId1,
      MovieTasteRatingModel
    );
    const result2 = await tasteVectorService.buildCompleteTasteVector(
      userId2,
      MovieTasteRatingModel
    );

    // Check if enough data
    if (
      result1.totalRatedMovies < MINIMUM_RATED_MOVIES ||
      result2.totalRatedMovies < MINIMUM_RATED_MOVIES
    ) {
      return {
        match_percentage: null,
        status: "insufficient_data",
        message: `Need at least ${MINIMUM_RATED_MOVIES} movie ratings to calculate match`,
        user1_ratings: result1.totalRatedMovies,
        user2_ratings: result2.totalRatedMovies,
        required: MINIMUM_RATED_MOVIES
      };
    }

    // Calculate similarity
    const similarity = similarityService.cosineSimilarity(
      result1.vector,
      result2.vector
    );
    const matchPercentage = similarityService.similarityToPercentage(similarity);

    // Get genre compatibility
    const genreCompatibility = similarityService.getGenreCompatibility(
      result1.vector,
      result2.vector
    );

    // Generate summary
    const summary = similarityService.generateSummary(
      matchPercentage,
      genreCompatibility
    );

    return {
      match_percentage: matchPercentage,
      status: "success",
      similarity_score: parseFloat(similarity.toFixed(3)),
      genre_compatibility: genreCompatibility,
      summary,
      user1_genres: Object.keys(result1.vector).length,
      user2_genres: Object.keys(result2.vector).length,
      user1_ratings: result1.totalRatedMovies,
      user2_ratings: result2.totalRatedMovies
    };
  } catch (error) {
    console.error("Error calculating taste match:", error);
    return {
      status: "error",
      message: error.message
    };
  }
}

/**
 * Save or update user's taste vector
 * @param {Number} userId - User ID
 * @param {Object} tasteData - {vector, totalRatedMovies, genresCount}
 */
async function saveTasteVector(userId, tasteData) {
  try {
    const [vector, created] = await UserTasteVector.findOrCreate({
      where: { user_id: userId },
      defaults: {
        user_id: userId,
        taste_vector: tasteData.vector,
        total_rated_movies: tasteData.totalRatedMovies,
        genres_count: tasteData.genresCount,
        last_updated: new Date()
      }
    });

    if (!created) {
      await vector.update({
        taste_vector: tasteData.vector,
        total_rated_movies: tasteData.totalRatedMovies,
        genres_count: tasteData.genresCount,
        last_updated: new Date()
      });
    }

    return vector;
  } catch (error) {
    console.error("Error saving taste vector:", error);
    throw error;
  }
}

/**
 * Get cached taste vector
 * @param {Number} userId - User ID
 * @returns {Object} Cached taste vector or null
 */
async function getCachedTasteVector(userId) {
  try {
    const vector = await UserTasteVector.findOne({
      where: { user_id: userId }
    });

    return vector ? vector.toJSON() : null;
  } catch (error) {
    console.error("Error getting cached taste vector:", error);
    return null;
  }
}

/**
 * Delete cached taste vector
 * (Called when user votes, forcing recalculation)
 * @param {Number} userId - User ID
 */
async function invalidateTasteVector(userId) {
  try {
    await UserTasteVector.destroy({
      where: { user_id: userId }
    });
  } catch (error) {
    console.error("Error invalidating taste vector:", error);
  }
}

module.exports = {
  calculateTasteMatch,
  saveTasteVector,
  getCachedTasteVector,
  invalidateTasteVector,
  MINIMUM_RATED_MOVIES
};
