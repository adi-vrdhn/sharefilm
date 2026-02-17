const { UserTasteMovie } = require("../models");

/**
 * Calculate match percentage based on genre priority
 * Weighted: 60% genre, 20% directors, 20% actors
 */
const calculateMatchPercentage = (user1Movies, user2Movies) => {
  if (!user1Movies || !user2Movies || user1Movies.length === 0 || user2Movies.length === 0) {
    return 0;
  }

  let totalGenreMatch = 0;
  let totalDirectorMatch = 0;
  let totalActorMatch = 0;

  // Compare each movie from user1 with all movies from user2
  user1Movies.forEach((movie1) => {
    const genreMatches = [];
    const directorMatches = [];
    const actorMatches = [];

    user2Movies.forEach((movie2) => {
      // Genre matching (primary - 60%)
      if (movie1.genres && movie2.genres && movie1.genres.length > 0 && movie2.genres.length > 0) {
        const commonGenres = movie1.genres.filter((g) => movie2.genres.includes(g));
        if (commonGenres.length > 0) {
          // Calculate percentage of common genres relative to total unique genres
          const totalUniqueGenres = new Set([...movie1.genres, ...movie2.genres]).size;
          genreMatches.push((commonGenres.length / totalUniqueGenres) * 100);
        }
      }

      // Director matching (secondary - 20%)
      if (movie1.directors && movie2.directors && movie1.directors.length > 0 && movie2.directors.length > 0) {
        const commonDirectors = movie1.directors.filter((d) => movie2.directors.includes(d));
        if (commonDirectors.length > 0) {
          const totalUniqueDirectors = new Set([...movie1.directors, ...movie2.directors]).size;
          directorMatches.push((commonDirectors.length / totalUniqueDirectors) * 100);
        }
      }

      // Actor matching (secondary - 20%)
      if (movie1.cast && movie2.cast && movie1.cast.length > 0 && movie2.cast.length > 0) {
        const commonActors = movie1.cast.filter((a) => movie2.cast.includes(a));
        if (commonActors.length > 0) {
          const totalUniqueActors = new Set([...movie1.cast, ...movie2.cast]).size;
          actorMatches.push((commonActors.length / totalUniqueActors) * 100);
        }
      }
    });

    // Get average for this movie comparison
    if (genreMatches.length > 0) {
      totalGenreMatch += Math.max(...genreMatches);
    }
    if (directorMatches.length > 0) {
      totalDirectorMatch += Math.max(...directorMatches);
    }
    if (actorMatches.length > 0) {
      totalActorMatch += Math.max(...actorMatches);
    }
  });

  // Normalize by number of movies
  const avgGenreMatch = (totalGenreMatch / user1Movies.length) || 0;
  const avgDirectorMatch = (totalDirectorMatch / user1Movies.length) || 0;
  const avgActorMatch = (totalActorMatch / user1Movies.length) || 0;

  // Weighted calculation: 60% genre, 20% directors, 20% actors
  const matchPercentage = Math.round(
    avgGenreMatch * 0.6 + avgDirectorMatch * 0.2 + avgActorMatch * 0.2
  );

  return Math.min(100, Math.max(0, matchPercentage));
};

/**
 * Find movies with matching genres/directors/actors
 */
const findSimilarMovies = (user1Movies, user2Movies) => {
  const similarMovies = [];

  user1Movies.forEach((movie1) => {
    user2Movies.forEach((movie2) => {
      if (movie1.id === movie2.id) {
        // Exact same movie
        similarMovies.push({
          movie1,
          movie2,
          type: "exact",
          title: movie1.title,
          matchReason: "Both have this movie in their taste"
        });
        return;
      }

      // Check for genre match
      const commonGenres = movie1.genre_names?.filter((g) => movie2.genre_names?.includes(g)) || [];
      if (commonGenres.length > 0) {
        similarMovies.push({
          movie1,
          movie2,
          type: "genre",
          matchedGenres: commonGenres,
          matchReason: `Both have ${commonGenres.join(", ")} movies`
        });
        return;
      }

      // Check for director match
      const commonDirectors = movie1.directors?.filter((d) => movie2.directors?.includes(d)) || [];
      if (commonDirectors.length > 0) {
        similarMovies.push({
          movie1,
          movie2,
          type: "director",
          matchedDirectors: commonDirectors,
          matchReason: `Both have ${commonDirectors.join(", ")} films`
        });
        return;
      }

      // Check for actor match
      const commonActors = movie1.cast?.filter((a) => movie2.cast?.includes(a)) || [];
      if (commonActors.length > 0) {
        similarMovies.push({
          movie1,
          movie2,
          type: "cast",
          matchedActors: commonActors,
          matchReason: `Both have ${commonActors.slice(0, 2).join(", ")} in their movies`
        });
      }
    });
  });

  return similarMovies;
};

/**
 * Get all movies for a user's taste
 */
const getUserTasteMovies = async (userId) => {
  try {
    const movies = await UserTasteMovie.findAll({
      where: { userId },
      raw: true,
      order: [["createdAt", "DESC"]]
    });
    return movies;
  } catch (error) {
    console.error("Error fetching user taste movies:", error);
    return [];
  }
};

module.exports = {
  calculateMatchPercentage,
  findSimilarMovies,
  getUserTasteMovies
};
