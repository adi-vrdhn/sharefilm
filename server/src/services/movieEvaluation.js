/**
 * Movie Evaluation System
 * 
 * Implements vector-based movie matching with:
 * - Movie feature vectors
 * - User taste vectors
 * - Cosine similarity for matching
 * - Weighted scoring for recommendations
 */

const axios = require("axios");
const TMDB_BASE = "https://api.themoviedb.org/3";

/**
 * STEP 1: Movie Vector Representation
 * Creates a feature vector for each movie
 */
class MovieVector {
  constructor(movie, genres = {}) {
    this.movieId = movie.id;
    this.title = movie.title;
    this.rating = (movie.vote_average || 0) / 10; // Normalize 0-1
    this.popularity = Math.min((movie.popularity || 0) / 100, 1); // Normalize 0-1
    this.year = movie.release_date ? parseInt(movie.release_date.split("-")[0]) : 2024;
    this.yearNormalized = this.normalizeYear(this.year);
    
    // Genre vector (one-hot encoding)
    this.genreVector = {};
    (movie.genre_ids || []).forEach(id => {
      this.genreVector[id] = 1;
    });
    
    // Directors, cast, keywords
    this.directors = movie.directors || [];
    this.cast = movie.cast || [];
    this.keywords = movie.keywords || [];
    
    // Calculated features
    this.blockbusterScore = this.calculateBlockbusterScore();
  }

  normalizeYear(year) {
    // Normalize year 1900-2030 to 0-1 range
    const minYear = 1900;
    const maxYear = 2030;
    return Math.max(0, Math.min(1, (year - minYear) / (maxYear - minYear)));
  }

  calculateBlockbusterScore() {
    // Blockbuster = high popularity + high rating
    return this.popularity * 0.6 + this.rating * 0.4;
  }

  // Convert to array form for calculations
  toArray(genreCount = 28) {
    // Genre dimensions (one-hot)
    const genreArray = new Array(genreCount).fill(0);
    Object.keys(this.genreVector).forEach(id => {
      const idx = parseInt(id) - 1;
      if (idx >= 0 && idx < genreCount) {
        genreArray[idx] = this.genreVector[id];
      }
    });

    // Additional dimensions: [rating, popularity, year_norm, blockbuster]
    return [
      ...genreArray,
      this.rating,
      this.popularity,
      this.yearNormalized,
      this.blockbusterScore
    ];
  }

  // For debugging
  getFeatures() {
    return {
      movie: this.title,
      rating: this.rating,
      popularity: this.popularity,
      year: this.year,
      blockbusterScore: this.blockbusterScore,
      genreCount: Object.keys(this.genreVector).length,
      directors: this.directors.length,
      cast: this.cast.length,
      keywords: this.keywords.length
    };
  }
}

/**
 * STEP 2: User Taste Vector
 * Average of all user's selected movie vectors
 */
class UserTasteVector {
  constructor(movieVectors = []) {
    this.movieCount = movieVectors.length;
    this.movies = movieVectors;
    this.vector = this.computeAverageVector();
    this.tasteProfile = this.computeTasteProfile();
  }

  computeAverageVector() {
    if (this.movieCount === 0) return [];

    const movieArrays = this.movies.map(m => m.toArray());
    const dimensions = movieArrays[0].length;
    const average = new Array(dimensions).fill(0);

    movieArrays.forEach(arr => {
      arr.forEach((val, idx) => {
        average[idx] += val / this.movieCount;
      });
    });

    return average;
  }

  computeTasteProfile() {
    if (this.movieCount === 0) {
      return {
        avgRating: 0,
        avgPopularity: 0,
        avgYear: 2024,
        topGenres: {},
        topDirectors: [],
        topCast: [],
        entropy: 0,
        diversity: "unknown",
        blockbusterBias: 0
      };
    }

    const ratings = this.movies.map(m => m.rating);
    const popularities = this.movies.map(m => m.popularity);
    const years = this.movies.map(m => m.year);

    // Genre frequency
    const genreFreq = {};
    this.movies.forEach(movie => {
      Object.keys(movie.genreVector).forEach(genreId => {
        genreFreq[genreId] = (genreFreq[genreId] || 0) + 1;
      });
    });

    // Top genres
    const topGenres = Object.entries(genreFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .reduce((acc, [id, count]) => {
        acc[id] = count / this.movieCount;
        return acc;
      }, {});

    // Director frequency
    const directorFreq = {};
    this.movies.forEach(movie => {
      movie.directors.forEach(dir => {
        directorFreq[dir] = (directorFreq[dir] || 0) + 1;
      });
    });
    const topDirectors = Object.entries(directorFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count, frequency: count / this.movieCount }));

    // Cast frequency
    const castFreq = {};
    this.movies.forEach(movie => {
      movie.cast.forEach(actor => {
        castFreq[actor] = (castFreq[actor] || 0) + 1;
      });
    });
    const topCast = Object.entries(castFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count, frequency: count / this.movieCount }));

    // Entropy (diversity measure)
    const genreProbs = Object.values(topGenres);
    const entropy = -genreProbs.reduce((sum, p) => sum + (p > 0 ? p * Math.log2(p) : 0), 0);
    const maxEntropy = Math.log2(Object.keys(topGenres).length || 1);
    const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;

    // Blockbuster bias
    const blockbusterScores = this.movies.map(m => m.blockbusterScore);
    const avgBlockbusterScore = blockbusterScores.reduce((a, b) => a + b, 0) / this.movieCount;

    return {
      avgRating: ratings.reduce((a, b) => a + b, 0) / this.movieCount,
      avgPopularity: popularities.reduce((a, b) => a + b, 0) / this.movieCount,
      avgYear: Math.round(years.reduce((a, b) => a + b, 0) / this.movieCount),
      topGenres,
      topDirectors,
      topCast,
      entropy: normalizedEntropy,
      diversity: normalizedEntropy > 0.6 ? "diverse" : normalizedEntropy > 0.3 ? "moderate" : "niche",
      blockbusterBias: avgBlockbusterScore
    };
  }

  getMagnitude() {
    return Math.sqrt(this.vector.reduce((sum, val) => sum + val * val, 0));
  }
}

/**
 * STEP 3: Cosine Similarity Calculator
 */
function cosineSimilarity(vec1, vec2) {
  if (vec1.length === 0 || vec2.length === 0) return 0;

  const dotProduct = vec1.reduce((sum, val, idx) => sum + val * vec2[idx], 0);
  const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  const similarity = dotProduct / (magnitude1 * magnitude2);
  return Math.max(-1, Math.min(1, similarity)); // Clamp to [-1, 1]
}

// Convert cosine similarity (-1 to 1) to percentage (0 to 100)
function cosineToPercentage(cosineSimilarity) {
  return ((cosineSimilarity + 1) / 2) * 100;
}

/**
 * STEP 4: Movie-to-User Scoring
 * Weighted formula for suggestion scoring
 */
function scoreMovieForUser(movieVector, userTasteVector) {
  const cosine = cosineSimilarity(movieVector.toArray(), userTasteVector.vector);
  const cosineScore = cosineToPercentage(cosine);

  // Genre overlap
  const commonGenres = Object.keys(movieVector.genreVector).filter(
    id => userTasteVector.movies.some(m => m.genreVector[id])
  ).length;
  const totalGenres = new Set([
    ...Object.keys(movieVector.genreVector),
    ...userTasteVector.movies.flatMap(m => Object.keys(m.genreVector))
  ]).size;
  const genreOverlapScore = totalGenres > 0 ? (commonGenres / totalGenres) * 100 : 0;

  // Rating similarity
  const ratingDiff = Math.abs(movieVector.rating - userTasteVector.tasteProfile.avgRating);
  const ratingSimilarityScore = Math.max(0, (1 - ratingDiff) * 100);

  // Popularity weight (boost if user likes blockbusters, suppress if user likes niche)
  const popularityWeightScore = 
    (movieVector.popularity * userTasteVector.tasteProfile.blockbusterBias * 100) +
    ((1 - movieVector.popularity) * (1 - userTasteVector.tasteProfile.blockbusterBias) * 100);

  // Year proximity
  const yearDiff = Math.abs(movieVector.year - userTasteVector.tasteProfile.avgYear);
  const maxYearDiff = 50;
  const yearProximityScore = Math.max(0, (1 - yearDiff / maxYearDiff) * 100);

  // Weighted combination
  const finalScore =
    0.4 * cosineScore +
    0.2 * genreOverlapScore +
    0.15 * ratingSimilarityScore +
    0.15 * popularityWeightScore +
    0.1 * yearProximityScore;

  return {
    score: Math.round(finalScore),
    breakdown: {
      cosine: Math.round(cosineScore),
      genreOverlap: Math.round(genreOverlapScore),
      ratingSimilarity: Math.round(ratingSimilarityScore),
      popularityWeight: Math.round(popularityWeightScore),
      yearProximity: Math.round(yearProximityScore)
    },
    details: {
      cosineRaw: cosine,
      genreCommon: commonGenres,
      genreTotal: totalGenres,
      ratingDiff,
      yearDiff,
      movieRating: movieVector.rating,
      moviePopularity: movieVector.popularity,
      movieYear: movieVector.year
    }
  };
}

/**
 * STEP 5: Similar Movie Expansion Formula
 */
function scoreSimilarMovie(candidateMovie, referenceMovie) {
  // Genre overlap (50%)
  const commonGenres = Object.keys(referenceMovie.genreVector).filter(
    id => candidateMovie.genreVector[id]
  ).length;
  const totalGenres = new Set([
    ...Object.keys(referenceMovie.genreVector),
    ...Object.keys(candidateMovie.genreVector)
  ]).size;
  const genreOverlap = totalGenres > 0 ? (commonGenres / totalGenres) * 100 : 0;

  // Director match (15%)
  const commonDirectors = referenceMovie.directors.filter(
    dir => candidateMovie.directors.includes(dir)
  ).length;
  const directorMatchScore = Math.min(100, commonDirectors * 50); // Each match = 50 points

  // Cast match (10%)
  const commonCast = referenceMovie.cast.filter(
    actor => candidateMovie.cast.includes(actor)
  ).length;
  const castMatchScore = Math.min(100, commonCast * 20); // Each match = 20 points

  // Rating closeness (15%)
  const ratingDiff = Math.abs(referenceMovie.rating - candidateMovie.rating);
  const ratingClosenessScore = Math.max(0, (1 - ratingDiff) * 100);

  // Keyword similarity (10%)
  const commonKeywords = referenceMovie.keywords.filter(
    kw => candidateMovie.keywords.includes(kw)
  ).length;
  const totalKeywords = new Set([
    ...referenceMovie.keywords,
    ...candidateMovie.keywords
  ]).size;
  const keywordSimilarity = totalKeywords > 0 ? (commonKeywords / totalKeywords) * 100 : 0;

  // Weighted combination
  const finalScore =
    0.5 * genreOverlap +
    0.2 * keywordSimilarity +
    0.15 * directorMatchScore +
    0.1 * castMatchScore +
    0.05 * ratingClosenessScore;

  return {
    score: Math.round(finalScore),
    breakdown: {
      genre: Math.round(genreOverlap),
      keyword: Math.round(keywordSimilarity),
      director: Math.round(directorMatchScore),
      cast: Math.round(castMatchScore),
      rating: Math.round(ratingClosenessScore)
    }
  };
}

module.exports = {
  MovieVector,
  UserTasteVector,
  cosineSimilarity,
  cosineToPercentage,
  scoreMovieForUser,
  scoreSimilarMovie
};
