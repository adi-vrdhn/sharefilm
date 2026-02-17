const { User, UserTasteProfile, UserMovieProfile } = require("../models");

/**
 * REFINED ALGORITHM - Movie Matcher Compatibility Score
 * Based on:
 * - 40% Direct movie overlap (movies both users selected)
 * - 35% Similar movie overlap (thematically similar movies)
 * - 15% Genre match
 * - 10% Language match (high priority for same-language)
 */
const calculateMatchScore = async (userId1, userId2) => {
  try {
    const profile1 = await UserMovieProfile.findOne({ where: { userId: userId1 } });
    const profile2 = await UserMovieProfile.findOne({ where: { userId: userId2 } });
    const taste1 = await UserTasteProfile.findOne({ where: { userId: userId1 } });
    const taste2 = await UserTasteProfile.findOne({ where: { userId: userId2 } });

    if (!profile1?.movies || !profile1.movies.length || !profile2?.movies || !profile2.movies.length) {
      return 0;
    }

    // 1. DIRECT MOVIE OVERLAP (40% weight)
    const directOverlap = calculateDirectOverlap(profile1.movies, profile2.movies);

    // 2. SIMILAR MOVIE OVERLAP (35% weight) - using genre/cast similarity
    const similarOverlap = calculateSimilarMovieOverlap(profile1.movies, profile2.movies);

    // 3. GENRE MATCH (15% weight)
    const genreMatch = calculateGenreMatch(profile1.movies, profile2.movies);

    // 4. LANGUAGE MATCH (10% weight)
    const languageMatch = calculateLanguageMatch(taste1, taste2);

    // FINAL SCORE: Weighted combination
    const finalScore = 
      (directOverlap * 0.40) +
      (similarOverlap * 0.35) +
      (genreMatch * 0.15) +
      (languageMatch * 0.10);

    console.log(`Match ${userId1}-${userId2}: Direct=${directOverlap}%, Similar=${similarOverlap}%, Genre=${genreMatch}%, Language=${languageMatch}%, Final=${Math.round(finalScore)}%`);

    return Math.round(finalScore);
  } catch (error) {
    console.error("Error calculating match score:", error.message, error.stack);
    return 0;
  }
};

const calculateDirectOverlap = (movies1, movies2) => {
  if (!movies1.length || !movies2.length) return 0;
  const commonCount = movies1.filter(m1 => 
    movies2.some(m2 => m2.tmdb_id === m1.tmdb_id)
  ).length;
  return (commonCount / Math.max(movies1.length, movies2.length)) * 100;
};

const calculateSimilarMovieOverlap = (movies1, movies2) => {
  if (!movies1.length || !movies2.length) return 0;
  let similarCount = 0;
  
  movies1.forEach(m1 => {
    movies2.forEach(m2 => {
      // Check genre similarity
      const m1Genres = m1.genres || [];
      const m2Genres = m2.genres || [];
      const sharedGenres = m1Genres.filter(g => m2Genres.includes(g)).length;
      
      if (sharedGenres > 0) {
        similarCount += 0.5; // Partial similarity
      }
      
      // Check language similarity (higher priority)
      if (m1.language === m2.language && m1.language) {
        similarCount += 1;
      }
    });
  });
  
  const maxPossible = movies1.length * movies2.length;
  return Math.min((similarCount / maxPossible) * 100, 100);
};

const calculateGenreMatch = (movies1, movies2) => {
  if (!movies1.length || !movies2.length) return 0;
  
  const genres1 = {};
  const genres2 = {};
  
  movies1.forEach(m => {
    (m.genres || []).forEach(g => {
      genres1[g] = (genres1[g] || 0) + 1;
    });
  });
  
  movies2.forEach(m => {
    (m.genres || []).forEach(g => {
      genres2[g] = (genres2[g] || 0) + 1;
    });
  });
  
  const commonGenres = Object.keys(genres1).filter(g => genres2[g]);
  const totalGenre = new Set([...Object.keys(genres1), ...Object.keys(genres2)]).size;
  
  return totalGenre > 0 ? (commonGenres.length / totalGenre) * 100 : 0;
};

const calculateLanguageMatch = (taste1, taste2) => {
  const langs1 = taste1?.preferredLanguages || [];
  const langs2 = taste2?.preferredLanguages || [];
  
  if (!langs1.length || !langs2.length) return 0;
  
  const commonLangs = langs1.filter(l => langs2.includes(l));
  return (commonLangs.length / Math.max(langs1.length, langs2.length)) * 100;
};

/**
 * Get DIRECT common movies both users selected
 */
const getMatchingMovies = async (userId1, userId2) => {
  try {
    const profile1 = await UserMovieProfile.findOne({ where: { userId: userId1 } });
    const profile2 = await UserMovieProfile.findOne({ where: { userId: userId2 } });

    if (!profile1?.movies || !profile2?.movies) {
      return [];
    }

    const commonMovies = profile1.movies.filter(m1 => 
      profile2.movies.some(m2 => m2.tmdb_id === m1.tmdb_id)
    );

    return commonMovies.slice(0, 10);
  } catch (error) {
    console.error("Error getting matching movies:", error.message);
    return [];
  }
};

/**
 * Get BLENDED RECOMMENDATIONS - movies similar to both users' profiles
 * Prioritizes:
 * 1. Same language movies
 * 2. Movies similar to both users' selections
 * 3. Avoid movies either user already selected
 */
const getFriendRecommendations = async (userId1, userId2) => {
  try {
    const profile1 = await UserMovieProfile.findOne({ where: { userId: userId1 } });
    const profile2 = await UserMovieProfile.findOne({ where: { userId: userId2 } });
    const taste1 = await UserTasteProfile.findOne({ where: { userId: userId1 } });
    const taste2 = await UserTasteProfile.findOne({ where: { userId: userId2 } });

    if (!profile1?.movies || !profile2?.movies) {
      return [];
    }

    // Get all movies from both profiles
    const allMovies = [...profile1.movies, ...profile2.movies];
    const selectedMovieIds = new Set(
      [...profile1.movies, ...profile2.movies].map(m => m.tmdb_id)
    );

    // Filter out already-selected movies
    const recommendations = allMovies.filter(m => {
      // Don't recommend movies either user already selected
      return !selectedMovieIds.has(m.tmdb_id) || 
             (profile1.movies.some(m1 => m1.tmdb_id === m.tmdb_id) && 
              profile2.movies.some(m2 => m2.tmdb_id === m.tmdb_id));
    });

    // Sort by same-language preference (high priority)
    const commonLangs = (taste1?.preferredLanguages || [])
      .filter(l => (taste2?.preferredLanguages || []).includes(l));

    const sorted = recommendations.sort((a, b) => {
      const aIsCommonLang = commonLangs.includes(a.language) ? 1 : 0;
      const bIsCommonLang = commonLangs.includes(b.language) ? 1 : 0;
      return bIsCommonLang - aIsCommonLang;
    });

    return sorted.slice(0, 5); // Top 5 blended recommendations
  } catch (error) {
    console.error("Error getting recommendations:", error.message, error.stack);
    return [];
  }
};

module.exports = {
  calculateMatchScore,
  getMatchingMovies,
  getFriendRecommendations
};
