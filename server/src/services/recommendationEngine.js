const { Movie, SwipeEvent, UserTasteVector } = require("../models");
const { Op } = require("sequelize");
const axios = require("axios");

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

/**
 * ADVANCED NEXT SHOW RECOMMENDATION FORMULA
 * Priority: Language > Director > Actor > Genre > Platform > Era > Popularity > Friends
 * 
 * Score(M) = 0.25 × Language_match
 *          + 0.20 × Director_affinity
 *          + 0.15 × Actor_affinity
 *          + 0.15 × Genre_similarity
 *          + 0.10 × Platform_match
 *          + 0.05 × Era_preference
 *          + 0.05 × Friend_watch_boost
 *          + 0.05 × Popularity_weight
 */
function calculateAdvancedRecommendationScore(
  movie,
  userTasteVector,
  watchedTmdbIds,
  friendsWatchedCount = 0
) {
  if (watchedTmdbIds.includes(movie.id)) {
    return -1; // Already watched
  }

  const tasteVector = userTasteVector.taste_vector || {};

  // 1. Language Match (0.25 weight) - HIGHEST PRIORITY
  const movieLanguage = movie.original_language || "en";
  const languageMatch = tasteVector[`language_${movieLanguage}`] || 0;

  // 2. Director Affinity (0.20 weight)
  let directorAffinity = 0;
  if (movie.director) {
    const directorKey = `director_${movie.director}`;
    directorAffinity = tasteVector[directorKey] || 0;
  }

  // 3. Actor Affinity (0.15 weight) - Average of top actors
  let actorAffinity = 0;
  if (movie.cast && movie.cast.length > 0) {
    const actorScores = movie.cast.slice(0, 5).map((actor) => {
      const actorKey = `actor_${actor}`;
      return tasteVector[actorKey] || 0;
    });
    actorAffinity = actorScores.reduce((a, b) => a + b, 0) / Math.max(actorScores.length, 1);
  }

  // 4. Genre Similarity (0.15 weight)
  let genreSimilarity = 0;
  if (movie.genres && movie.genres.length > 0) {
    const genreScores = movie.genres.map((genreId) => {
      const genreKey = `genre_${genreId}`;
      return tasteVector[genreKey] || 0;
    });
    genreSimilarity = genreScores.reduce((a, b) => a + b, 0) / Math.max(genreScores.length, 1);
  }

  // 5. Platform Match (0.10 weight)
  let platformMatch = 0;
  if (movie.platform) {
    const platformKey = `platform_${movie.platform}`;
    platformMatch = tasteVector[platformKey] || 0;
  }

  // 6. Era Preference (0.05 weight) - Year closeness
  let eraPreference = 0;
  const releaseYear = parseInt(movie.release_date?.split("-")[0]);
  if (releaseYear) {
    const currentYear = new Date().getFullYear();
    const yearDiff = Math.abs(currentYear - releaseYear);
    eraPreference = Math.max(0, 1 - yearDiff / 30); // Closer to 1 for recent, 0 for very old
  }

  // 7. Friend Watch Boost (0.05 weight)
  const friendWatchBoost = Math.log(1 + friendsWatchedCount) / Math.log(10);

  // 8. Popularity Weight (0.05 weight)
  const popularityWeight = Math.min((movie.popularity || 0) / 100, 1);

  // FINAL SCORE
  const finalScore =
    0.25 * languageMatch +
    0.20 * directorAffinity +
    0.15 * actorAffinity +
    0.15 * genreSimilarity +
    0.10 * platformMatch +
    0.05 * eraPreference +
    0.05 * friendWatchBoost +
    0.05 * popularityWeight;

  // Normalize to 0-100
  return Math.max(0, Math.min(100, finalScore * 100));
}

/**
 * Get personalized recommendations for a user with optional filters
 * @param {Number} userId - User ID
 * @param {Object} filters - Filter options {genres, languages, platforms}
 * @param {Number} limit - Number of recommendations to return
 * @returns {Array} Recommended movies
 */
async function getRecommendations(userId, filters = {}, limit = 20) {
  try {
    console.log(`📊 Generating advanced recommendations for user ${userId}...`);

    // Get or create user's taste vector
    let userTaste = await UserTasteVector.findOne({
      where: { userId },
    });

    if (!userTaste) {
      userTaste = await UserTasteVector.create({
        userId,
        taste_vector: {},
        total_rated_movies: 0,
      });
    }

    // Get watched movies to exclude
    const watchedMovies = await SwipeEvent.findAll({
      where: {
        userId,
        action: { [Op.in]: ["watched", "interested"] },
      },
      attributes: ["tmdbId"],
      raw: true,
    });
    const watchedTmdbIds = watchedMovies.map((w) => w.tmdbId);

    // Build TMDB query with filters
    let tmdbUrl = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}`;
    tmdbUrl += `&language=en-US&sort_by=popularity.desc&include_adult=false`;

    // Add filter parameters
    if (filters.languages && filters.languages.length > 0) {
      tmdbUrl += `&with_original_language=${filters.languages.join("|")}`;
    }

    if (filters.genres && filters.genres.length > 0) {
      tmdbUrl += `&with_genres=${filters.genres.join(",")}`;
    }

    // Fetch multiple pages to get diverse candidates
    console.log(`🎬 Fetching candidate movies from TMDB...`);
    const candidateMovies = [];

    for (let page = 1; page <= 3; page++) {
      try {
        const response = await axios.get(`${tmdbUrl}&page=${page}`);
        candidateMovies.push(...(response.data.results || []));
      } catch (err) {
        console.warn(`Failed to fetch page ${page}:`, err.message);
      }
    }

    console.log(`📽️ Got ${candidateMovies.length} candidate movies`);

    // Score and sort candidates
    const scoredMovies = candidateMovies
      .filter((m) => !watchedTmdbIds.includes(m.id))
      .map((movie) => ({
        ...movie,
        recommendationScore: calculateAdvancedRecommendationScore(
          movie,
          userTaste,
          watchedTmdbIds,
          0 // friends_watched_count - can be added later
        ),
      }))
      .filter((m) => m.recommendationScore > 0)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);

    console.log(`✅ Generated ${scoredMovies.length} recommendations`);
    return scoredMovies;
  } catch (error) {
    console.error("❌ Recommendation engine error:", error.message);
    throw error;
  }
}

/**
 * Update user taste vector based on swipe action
 * Weights update based on action:
 * - Right Swipe (watched): +0.6 strong boost
 * - Long Press (watchlist): +0.2 mild interest
 * - Left Swipe (passed): -0.3 penalty
 * 
 * Each action updates: genre, language, actor, director, platform weights
 */
async function updateUserTaste(
  userId,
  tmdbId,
  action,
  movieData = {}
) {
  try {
    let tasteVector = await UserTasteVector.findOne({
      where: { userId },
    });

    if (!tasteVector) {
      tasteVector = await UserTasteVector.create({
        userId,
        taste_vector: {},
        total_rated_movies: 0,
      });
    }

    // Get current taste vector
    let vector = tasteVector.taste_vector || {};

    // Determine weight based on action
    let weight = 0;
    if (action === "watched") {
      weight = 0.6; // Strong positive signal
    } else if (action === "interested") {
      weight = 0.2; // Mild interest
    } else if (action === "passed") {
      weight = -0.3; // Negative signal
    }

    // Update genre weights
    if (movieData.genres && Array.isArray(movieData.genres)) {
      movieData.genres.forEach((genreId) => {
        const key = `genre_${genreId}`;
        vector[key] = (vector[key] || 0) + weight * 0.4;
        // Clamp to [-1, 1]
        vector[key] = Math.max(-1, Math.min(1, vector[key]));
      });
    }

    // Update language weight (HIGHEST PRIORITY)
    if (movieData.language) {
      const langKey = `language_${movieData.language}`;
      vector[langKey] = (vector[langKey] || 0) + weight * 0.5; // 0.5 weight to language
      vector[langKey] = Math.max(-1, Math.min(1, vector[langKey]));
    }

    // Update director weight
    if (movieData.director) {
      const dirKey = `director_${movieData.director}`;
      vector[dirKey] = (vector[dirKey] || 0) + weight * 0.4;
      vector[dirKey] = Math.max(-1, Math.min(1, vector[dirKey]));
    }

    // Update actor weights
    if (movieData.cast && Array.isArray(movieData.cast)) {
      movieData.cast.slice(0, 5).forEach((actor) => {
        const actorKey = `actor_${actor}`;
        vector[actorKey] = (vector[actorKey] || 0) + weight * 0.3;
        vector[actorKey] = Math.max(-1, Math.min(1, vector[actorKey]));
      });
    }

    // Update platform weight
    if (movieData.platform) {
      const platKey = `platform_${movieData.platform}`;
      vector[platKey] = (vector[platKey] || 0) + weight * 0.2;
      vector[platKey] = Math.max(-1, Math.min(1, vector[platKey]));
    }

    // Update genre count for analytics
    let genresCounts = tasteVector.genres_count || {};
    if (movieData.genres && Array.isArray(movieData.genres)) {
      movieData.genres.forEach((genreId) => {
        genresCounts[genreId] = (genresCounts[genreId] || 0) + 1;
      });
    }

    // Update the taste vector
    await tasteVector.update({
      taste_vector: vector,
      total_rated_movies: tasteVector.total_rated_movies + 1,
      genres_count: genresCounts,
      last_updated: new Date(),
    });

    console.log(`✅ Updated taste vector for user ${userId} (action: ${action})`);
    return tasteVector;
  } catch (error) {
    console.error("❌ Error updating user taste:", error.message);
    throw error;
  }
}

/**
 * Calculate similarity between two movies
 * Used for "Find Similar Movies" feature
 * 
 * Similarity(A, B) = 0.25 × Language_match
 *                  + 0.20 × Director_match
 *                  + 0.15 × Actor_overlap
 *                  + 0.15 × Genre_overlap
 *                  + 0.10 × Platform_overlap
 *                  + 0.10 × Keyword_overlap
 *                  + 0.05 × Era_closeness
 * 
 * Then blend with user preference:
 * FinalScore = 0.7 × MovieSimilarity + 0.3 × UserPreferenceScore
 */
function calculateMovieSimilarity(movieA, movieB, userTasteVector = null) {
  // Language Match
  const languageMatch = movieA.original_language === movieB.original_language ? 1 : 0;

  // Director Match
  const directorMatch = movieA.director === movieB.director ? 1 : 0;

  // Actor Overlap (Jaccard similarity)
  const castA = new Set((movieA.cast || []).map((c) => c));
  const castB = new Set((movieB.cast || []).map((c) => c));
  const actorIntersection = new Set([...castA].filter((x) => castB.has(x)));
  const actorUnion = new Set([...castA, ...castB]);
  const actorOverlap = actorUnion.size > 0 ? actorIntersection.size / actorUnion.size : 0;

  // Genre Overlap (Jaccard similarity)
  const genreA = new Set(movieA.genres || []);
  const genreB = new Set(movieB.genres || []);
  const genreIntersection = new Set([...genreA].filter((x) => genreB.has(x)));
  const genreUnion = new Set([...genreA, ...genreB]);
  const genreOverlap = genreUnion.size > 0 ? genreIntersection.size / genreUnion.size : 0;

  // Platform Overlap
  const platformMatch = movieA.platform === movieB.platform ? 1 : 0;

  // Keywords Overlap (if available)
  const keywordA = new Set((movieA.keywords || []).map((k) => k));
  const keywordB = new Set((movieB.keywords || []).map((k) => k));
  const keywordIntersection = new Set([...keywordA].filter((x) => keywordB.has(x)));
  const keywordUnion = new Set([...keywordA, ...keywordB]);
  const keywordOverlap = keywordUnion.size > 0 ? keywordIntersection.size / keywordUnion.size : 0;

  // Era Closeness
  const yearA = parseInt(movieA.release_date?.split("-")[0]) || new Date().getFullYear();
  const yearB = parseInt(movieB.release_date?.split("-")[0]) || new Date().getFullYear();
  const yearDiff = Math.abs(yearA - yearB);
  const eraCloseness = Math.max(0, 1 - yearDiff / 30);

  // Movie-to-Movie Similarity Score
  const movieSimilarity =
    0.25 * languageMatch +
    0.20 * directorMatch +
    0.15 * actorOverlap +
    0.15 * genreOverlap +
    0.10 * platformMatch +
    0.10 * keywordOverlap +
    0.05 * eraCloseness;

  // Blend with user preference if taste vector provided
  let finalScore = movieSimilarity;
  if (userTasteVector) {
    const userPrefScore = calculateAdvancedRecommendationScore(
      movieB,
      userTasteVector,
      [],
      0
    ) / 100; // Normalize to 0-1
    finalScore = 0.7 * movieSimilarity + 0.3 * userPrefScore;
  }

  return {
    score: finalScore,
    languageMatch,
    directorMatch,
    actorOverlap,
    genreOverlap,
    platformMatch,
    keywordOverlap,
    eraCloseness,
    reason: generateSimilarityReason({
      languageMatch,
      directorMatch,
      actorOverlap,
      genreOverlap,
    }),
  };
}

/**
 * Generate human-readable reason for similarity
 */
function generateSimilarityReason(factors) {
  const reasons = [];

  if (factors.languageMatch > 0) reasons.push("Same language");
  if (factors.directorMatch > 0) reasons.push("Same director");
  if (factors.actorOverlap > 0.3) reasons.push("Shared actors");
  if (factors.genreOverlap > 0.3) reasons.push("Similar genre");

  return reasons.length > 0 ? reasons.join(" • ") : "Similar match";
}

/**
 * Get similar movies for a given movie
 */
async function getSimilarMovies(baseMovieId, limit = 20, userTasteVector = null) {
  try {
    console.log(`🔍 Finding similar movies for ${baseMovieId}...`);

    // Fetch base movie details
    const baseResponse = await axios.get(
      `${TMDB_BASE_URL}/movie/${baseMovieId}?api_key=${TMDB_API_KEY}&append_to_response=credits`
    );
    const baseMovie = baseResponse.data;

    // Fetch candidates
    const candidates = [];
    for (let page = 1; page <= 2; page++) {
      try {
        const response = await axios.get(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&page=${page}`);
        candidates.push(...(response.data.results || []));
      } catch (err) {
        console.warn(`Failed to fetch page ${page}`);
      }
    }

    // Score similarity for each candidate
    const scoredMovies = candidates
      .filter((m) => m.id !== baseMovieId)
      .map((movie) => {
        const similarity = calculateMovieSimilarity(baseMovie, movie, userTasteVector);
        return {
          ...movie,
          similarityScore: similarity.score,
          similarityReason: similarity.reason,
        };
      })
      .filter((m) => m.similarityScore > 0)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    console.log(`✅ Found ${scoredMovies.length} similar movies`);
    return scoredMovies;
  } catch (error) {
    console.error("❌ Error finding similar movies:", error.message);
    throw error;
  }
}

module.exports = {
  getRecommendations,
  updateUserTaste,
  calculateAdvancedRecommendationScore,
  calculateMovieSimilarity,
  getSimilarMovies,
};
