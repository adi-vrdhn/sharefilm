const { Movie, SwipeEvent, UserTasteVector } = require("../models");
const { Op } = require("sequelize");
const axios = require("axios");

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

/**
 * Calculate recommendation score for a movie based on user taste
 * @param {Object} movie - Movie object with genre, language, etc
 * @param {Object} userTaste - User's taste vector/preferences
 * @param {Array} watchedTmdbIds - User's watched movie IDs
 * @returns {Number} Score 0-100
 */
function calculateRecommendationScore(movie, userTaste, watchedTmdbIds) {
  if (watchedTmdbIds.includes(movie.id)) {
    return -1; // Already watched
  }

  let score = 50; // Base score

  // Genre matching (25 points max)
  if (movie.genres && userTaste.preferredGenres) {
    const genreMatch = movie.genres.filter((g) =>
      userTaste.preferredGenres.includes(g.id)
    ).length;
    score += genreMatch * 5;
  }

  // Language preference (15 points max)
  if (movie.original_language === userTaste.preferredLanguages?.[0]) {
    score += 15;
  } else if (
    userTaste.preferredLanguages?.includes(movie.original_language)
  ) {
    score += 8;
  }

  // Rating/Popularity (20 points max)
  if (movie.vote_average >= 7.5) {
    score += 5 + (movie.vote_average - 7.5) * 2;
  } else if (movie.vote_average >= 6.5) {
    score += 3;
  }

  // Recency boost (10 points max)
  const releaseYear = parseInt(movie.release_date?.split("-")[0]);
  const currentYear = new Date().getFullYear();
  if (currentYear - releaseYear <= 3) {
    score += 5;
  }

  // Popularity boost (10 points max)
  const popularityScore = Math.min(movie.popularity / 100, 10);
  score += popularityScore;

  return Math.min(score, 100);
}

/**
 * Get personalized recommendations for a user
 * @param {Number} userId - User ID
 * @param {Number} limit - Number of recommendations to return
 * @returns {Array} Recommended movies
 */
async function getRecommendations(userId, limit = 5) {
  try {
    console.log(`📊 Generating recommendations for user ${userId}...`);

    // Get user's taste profile
    let userTaste = await UserTasteVector.findOne({
      where: { userId },
    });

    if (!userTaste) {
      // Create default taste vector
      userTaste = await UserTasteVector.create({
        userId,
        preferredGenres: [28, 35, 18], // Action, Comedy, Drama as default
        preferredLanguages: ["en"],
      });
    }

    // Get all watched movies
    const watchedMovies = await SwipeEvent.findAll({
      where: {
        userId,
        action: { [Op.in]: ["watched", "want"] },
      },
      attributes: ["tmdbId"],
      raw: true,
    });

    const watchedTmdbIds = watchedMovies.map((w) => w.tmdbId);

    // Get popular movies from TMDB as base candidates
    console.log(
      `🎬 Fetching popular movies from TMDB for filtering...`
    );

    const responses = {
      popular: await axios.get(
        `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`
      ),
      topRated: await axios.get(
        `${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&language=en-US&page=1`
      ),
      upcoming: await axios.get(
        `${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&language=en-US&page=1`
      ),
    };

    // Combine all movies and score them
    let allMovies = [
      ...responses.popular.data.results,
      ...responses.topRated.data.results,
      ...responses.upcoming.data.results,
    ];

    // Remove duplicates
    const uniqueMovies = Array.from(
      new Map(allMovies.map((m) => [m.id, m])).values()
    );

    // Score each movie
    const scoredMovies = uniqueMovies.map((movie) => ({
      ...movie,
      recommendationScore: calculateRecommendationScore(
        movie,
        userTaste,
        watchedTmdbIds
      ),
    }));

    // Filter out watched and score -1, then sort by score
    const recommendations = scoredMovies
      .filter((m) => m.recommendationScore >= 0)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);

    console.log(
      `✅ Generated ${recommendations.length} recommendations for user ${userId}`
    );

    return recommendations;
  } catch (error) {
    console.error("❌ Recommendation engine error:", error.message);
    throw error;
  }
}

/**
 * Update user taste vector based on swipe action
 * @param {Number} userId - User ID
 * @param {Number} tmdbId - Movie TMDB ID
 * @param {String} action - Swipe action (watched, want, nah)
 * @param {Array} genreIds - Genre IDs of the movie
 * @param {String} language - Movie language
 */
async function updateUserTaste(userId, tmdbId, action, genreIds = [], language = "en") {
  try {
    let taste = await UserTasteVector.findOne({ where: { userId } });

    if (!taste) {
      taste = await UserTasteVector.create({
        userId,
        preferredGenres: [],
        preferredLanguages: ["en"],
      });
    }

    // Update preferred genres based on action
    let genres = taste.preferredGenres || [];
    if (action === "watched" || action === "want") {
      // Boost these genres
      genreIds.forEach((gId) => {
        if (!genres.includes(gId)) {
          genres.push(gId);
        }
      });
    } else if (action === "nah") {
      // Remove from preferences
      genres = genres.filter((g) => !genreIds.includes(g));
    }

    // Update language preference
    let languages = taste.preferredLanguages || ["en"];
    if (language && action === "watched" && !languages.includes(language)) {
      languages.push(language);
    }

    await taste.update({
      preferredGenres: genres.slice(0, 10), // Limit to 10 genres
      preferredLanguages: languages.slice(0, 5), // Limit to 5 languages
    });

    console.log(`✅ Updated taste vector for user ${userId}`);
  } catch (error) {
    console.error("❌ Error updating user taste:", error.message);
  }
}

module.exports = {
  getRecommendations,
  updateUserTaste,
  calculateRecommendationScore,
};
