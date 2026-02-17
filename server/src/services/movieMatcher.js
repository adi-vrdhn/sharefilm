const { User, UserTasteProfile, UserMovieProfile } = require("../models");

/**
 * Calculate match score between two users based on their movie selections
 * Algorithm: 50% language match + 50% movie similarity
 */
const calculateMatchScore = async (userId1, userId2) => {
  try {
    const profile1 = await UserMovieProfile.findOne({ where: { userId: userId1 } });
    const profile2 = await UserMovieProfile.findOne({ where: { userId: userId2 } });
    const taste1 = await UserTasteProfile.findOne({ where: { userId: userId1 } });
    const taste2 = await UserTasteProfile.findOne({ where: { userId: userId2 } });

    if (!profile1?.movies || !profile2?.movies) {
      return 0;
    }

    const movies1 = profile1.movies.map(m => m.id);
    const movies2 = profile2.movies.map(m => m.id);

    // Movie overlap score
    const commonMovies = movies1.filter(id => movies2.includes(id)).length;
    const movieScore = (commonMovies / Math.max(movies1.length, movies2.length)) * 100;

    // Language overlap score (50% weight)
    const langs1 = taste1?.preferredLanguages || [];
    const langs2 = taste2?.preferredLanguages || [];
    const commonLangs = langs1.filter(l => langs2.includes(l)).length;
    const languageScore = langs1.length && langs2.length 
      ? (commonLangs / Math.max(langs1.length, langs2.length)) * 100 
      : 0;

    // Combined score: 50% language pref, 50% movie overlap
    const finalScore = (languageScore * 0.5) + (movieScore * 0.5);

    return Math.round(finalScore);
  } catch (error) {
    console.error("Error calculating match score:", error.message);
    return 0;
  }
};

/**
 * Get matching movies between two users
 */
const getMatchingMovies = async (userId1, userId2) => {
  try {
    const profile1 = await UserMovieProfile.findOne({ where: { userId: userId1 } });
    const profile2 = await UserMovieProfile.findOne({ where: { userId: userId2 } });

    if (!profile1?.movies || !profile2?.movies) {
      return [];
    }

    const commonMovieIds = profile1.movies
      .filter(m1 => profile2.movies.some(m2 => m2.id === m1.id))
      .map(m => m.id);

    const commonMovies = profile1.movies.filter(m => commonMovieIds.includes(m.id));
    return commonMovies;
  } catch (error) {
    console.error("Error getting matching movies:", error.message);
    return [];
  }
};

/**
 * Get friend's recommended movies based on match
 */
const getFriendRecommendations = async (userId1, userId2) => {
  try {
    const profile1 = await UserMovieProfile.findOne({ where: { userId: userId1 } });
    const profile2 = await UserMovieProfile.findOne({ where: { userId: userId2 } });

    if (!profile1?.movies || !profile2?.movies) {
      return [];
    }

    // Get movies user1 didn't select but user2 did
    const recommendations = profile2.movies.filter(
      m2 => !profile1.movies.some(m1 => m1.id === m2.id)
    );

    return recommendations.slice(0, 5); // Top 5 recommendations
  } catch (error) {
    console.error("Error getting recommendations:", error.message);
    return [];
  }
};

module.exports = {
  calculateMatchScore,
  getMatchingMovies,
  getFriendRecommendations
};
