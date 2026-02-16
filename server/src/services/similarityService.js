/**
 * Similarity Calculator Service
 * Implements Cosine Similarity algorithm for taste matching
 */

/**
 * Calculate cosine similarity between two vectors
 * @param {Object} vectorA - Taste vector (e.g., {action: 0.8, comedy: 0.2})
 * @param {Object} vectorB - Taste vector
 * @returns {Number} Similarity score between -1 and 1
 */
function cosineSimilarity(vectorA, vectorB) {
  if (!vectorA || !vectorB) return 0;

  // Get all unique genres from both vectors
  const allGenres = new Set([...Object.keys(vectorA), ...Object.keys(vectorB)]);

  if (allGenres.size === 0) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const genre of allGenres) {
    const valA = vectorA[genre] || 0;
    const valB = vectorB[genre] || 0;

    dotProduct += valA * valB;
    magnitudeA += valA * valA;
    magnitudeB += valB * valB;
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Convert similarity score to percentage
 * @param {Number} similarity - Cosine similarity (-1 to 1)
 * @returns {Number} Match percentage (0 to 100)
 */
function similarityToPercentage(similarity) {
  // Convert -1..1 to 0..100
  // -1 → 0%, 0 → 50%, 1 → 100%
  return Math.round(((similarity + 1) / 2) * 100);
}

/**
 * Calculate genre compatibility (how well genres match)
 * @param {Object} vectorA - Taste vector
 * @param {Object} vectorB - Taste vector
 * @returns {Object} Genre compatibility scores
 */
function getGenreCompatibility(vectorA, vectorB) {
  if (!vectorA || !vectorB) return {};

  const allGenres = new Set([...Object.keys(vectorA), ...Object.keys(vectorB)]);
  const compatibility = {};

  for (const genre of allGenres) {
    const valA = vectorA[genre] || 0;
    const valB = vectorB[genre] || 0;

    // Genre compatibility: how aligned are the values
    const similarity = cosineSimilarity({ [genre]: valA }, { [genre]: valB });
    compatibility[genre] = similarityToPercentage(similarity);
  }

  return compatibility;
}

/**
 * Generate summary of match
 * @param {Number} percentage - Match percentage
 * @param {Object} genreCompatibility - Genre compatibility scores
 * @returns {String} Human-readable summary
 */
function generateSummary(percentage, genreCompatibility) {
  if (percentage >= 80) {
    return "Excellent taste match! Very similar movie preferences.";
  } else if (percentage >= 70) {
    return "Great match! You enjoy similar types of movies.";
  } else if (percentage >= 60) {
    return "Good compatibility! Some shared taste in movies.";
  } else if (percentage >= 50) {
    return "Moderate match. Some overlapping preferences.";
  } else if (percentage >= 40) {
    return "Different tastes, but room for discovery.";
  } else {
    return "Very different tastes. Chance to explore new genres!";
  }
}

module.exports = {
  cosineSimilarity,
  similarityToPercentage,
  getGenreCompatibility,
  generateSummary
};
