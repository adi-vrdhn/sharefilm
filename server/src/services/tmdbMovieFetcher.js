/**
 * TMDB Movie Fetcher Service
 * Fetches and filters movies from TMDB API
 */

const axios = require("axios");

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Cache genre IDs to names
let genreCache = null;

/**
 * Fetch all genres from TMDB
 * @returns {Object} Genre mapping {id: name}
 */
async function fetchGenres() {
  try {
    if (genreCache) return genreCache;

    const response = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
      params: { api_key: TMDB_API_KEY }
    });

    genreCache = {};
    for (const genre of response.data.genres) {
      genreCache[genre.id] = genre.name;
    }

    return genreCache;
  } catch (error) {
    console.error("Error fetching genres:", error.message);
    return {};
  }
}

/**
 * Get genre names from genre IDs
 * @param {Array} genreIds - TMDB genre IDs
 * @returns {Array} Array of genre names
 */
async function getGenreNames(genreIds) {
  if (!genreIds || genreIds.length === 0) return [];

  const genres = await fetchGenres();
  return genreIds
    .map((id) => genres[id])
    .filter(Boolean);
}

/**
 * Fetch movies from TMDB
 * @param {Object} options - Query options
 * @returns {Array} Array of movies with full details
 */
async function fetchMoviesFromTMDB(options = {}) {
  try {
    const {
      page = 1,
      language = "en",
      genres = [],
      yearFrom = 2000,
      yearTo = new Date().getFullYear(),
      limit = 20
    } = options;

    const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        page,
        language: `${language}-${language.toUpperCase()}`,
        sort_by: "popularity.desc",
        "primary_release_date.gte": `${yearFrom}-01-01`,
        "primary_release_date.lte": `${yearTo}-12-31`,
        "with_genres": genres.length > 0 ? genres.join(",") : undefined,
        "vote_count.gte": 100
      }
    });

    const movies = response.data.results.slice(0, limit);

    // Enrich with genre names
    const genreMapping = await fetchGenres();
    const enrichedMovies = movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      genres: (movie.genre_ids || [])
        .map((id) => genreMapping[id])
        .filter(Boolean),
      release_date: movie.release_date,
      year: new Date(movie.release_date).getFullYear(),
      language: movie.original_language,
      popularity: movie.popularity,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      overview: movie.overview
    }));

    return enrichedMovies;
  } catch (error) {
    console.error("Error fetching movies from TMDB:", error.message);
    return [];
  }
}

/**
 * Fetch single movie details
 * @param {Number} tmdbId - Movie ID
 * @returns {Object} Movie details
 */
async function fetchMovieDetail(tmdbId) {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/${tmdbId}`,
      {
        params: { api_key: TMDB_API_KEY }
      }
    );

    const movie = response.data;
    const genreNames = movie.genres.map((g) => g.name);

    return {
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      genres: genreNames,
      release_date: movie.release_date,
      year: new Date(movie.release_date).getFullYear(),
      language: movie.original_language,
      popularity: movie.popularity,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      overview: movie.overview,
      runtime: movie.runtime
    };
  } catch (error) {
    console.error("Error fetching movie details:", error.message);
    return null;
  }
}

/**
 * Filter movies - exclude watched and already rated
 * @param {Array} movies - Movies list
 * @param {Array} watchedIds - IDs of watched movies
 * @param {Array} ratedIds - IDs of rated movies
 * @returns {Array} Filtered movies
 */
function filterMovies(movies, watchedIds = [], ratedIds = []) {
  const excludeIds = new Set([...watchedIds, ...ratedIds]);
  return movies.filter((movie) => !excludeIds.has(movie.id));
}

/**
 * Get next movie for taste matching
 * Balance between preference-matched and exploration movies
 * 60% matching preferences, 40% exploration
 * @param {Object} userPreferences - User preferences {languages, genreIds, yearRange}
 * @param {Array} watchedIds - Watched movie IDs
 * @param {Array} ratedIds - Rated movie IDs
 * @returns {Object} Next movie card
 */
async function getNextMovieForTasteMatch(
  userPreferences = {},
  watchedIds = [],
  ratedIds = []
) {
  try {
    const usePreference = Math.random() < 0.6; // 60% use preferences

    const params = {
      page: Math.floor(Math.random() * 3) + 1, // Pages 1-3
      limit: 8
    };

    if (usePreference && userPreferences.genreIds?.length > 0) {
      params.genres = userPreferences.genreIds;
    }

    if (userPreferences.language) {
      params.language = userPreferences.language;
    }

    if (userPreferences.yearRange) {
      params.yearFrom = userPreferences.yearRange[0];
      params.yearTo = userPreferences.yearRange[1];
    }

    const movies = await fetchMoviesFromTMDB(params);
    const filtered = filterMovies(movies, watchedIds, ratedIds);

    return filtered.length > 0 ? filtered[0] : null;
  } catch (error) {
    console.error("Error getting next movie for taste match:", error);
    return null;
  }
}

/**
 * Get friend's top genres from their movie ratings
 * @param {Number} friendId - Friend's user ID
 * @param {Object} MovieTasteRating - Model reference
 * @returns {Array} Top genre IDs sorted by frequency
 */
async function getFriendTopGenres(friendId, MovieTasteRatingModel) {
  try {
    const genreFrequency = {};

    const ratings = await MovieTasteRatingModel.findAll({
      where: { user_id: friendId },
      attributes: ["genres"]
    });

    for (const rating of ratings) {
      const genres = rating.genres || [];
      for (const genre of genres) {
        genreFrequency[genre] = (genreFrequency[genre] || 0) + 1;
      }
    }

    // Convert to array and sort by frequency descending
    const topGenres = Object.entries(genreFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // Top 5 genres
      .map((entry) => entry[0]);

    return topGenres;
  } catch (error) {
    console.error("Error getting friend's top genres:", error.message);
    return [];
  }
}

/**
 * Get next movie for Taste Match based on friend's preferences
 * If friend has < 20 movies: show popular movies (all genres)
 * If friend has >= 20 movies: show movies matching friend's top genres
 * Always excludes current user's watched + rated movies
 *
 * @param {Number} currentUserId - Current user ID
 * @param {Number} friendId - Friend's user ID
 * @param {Object} MovieTasteRating - MovieTasteRating model
 * @param {Object} UserMovie - UserMovie model
 * @returns {Object} Movie card ready for voting
 */
async function getNextMovieForTasteMatchWithFriend(
  currentUserId,
  friendId,
  MovieTasteRatingModel,
  UserMovieModel
) {
  try {
    // Get current user's watched and rated movies (to exclude)
    const watchedMovies = await UserMovieModel.findAll({
      where: { user_id: currentUserId },
      attributes: ["tmdb_id"]
    });

    const ratedMovies = await MovieTasteRatingModel.findAll({
      where: { user_id: currentUserId },
      attributes: ["tmdb_movie_id"]
    });

    const watchedIds = watchedMovies.map((m) => m.tmdb_id);
    const ratedIds = ratedMovies.map((m) => m.tmdb_movie_id);
    const excludeIds = new Set([...watchedIds, ...ratedIds]);

    // Get friend's rated movies count
    const friendRatingsCount = await MovieTasteRatingModel.count({
      where: { user_id: friendId }
    });

    let fetchOptions = {
      page: Math.floor(Math.random() * 3) + 1, // Pages 1-3
      limit: 20
    };

    // If friend has >= 20 movies: suggest based on friend's top genres
    if (friendRatingsCount >= 20) {
      const topGenres = await getFriendTopGenres(friendId, MovieTasteRatingModel);

      if (topGenres.length > 0) {
        // Convert genre names to TMDB genre IDs
        const genreMapping = await fetchGenres();
        const genreNameToId = {};
        Object.entries(genreMapping).forEach(([id, name]) => {
          genreNameToId[name] = parseInt(id);
        });

        const topGenreIds = topGenres
          .map((name) => genreNameToId[name])
          .filter(Boolean);

        if (topGenreIds.length > 0) {
          fetchOptions.genres = topGenreIds;
        }
      }
    }
    // If friend has < 20 movies: fetch popular movies (all genres, no filter)

    // Fetch candidate movies
    const movies = await fetchMoviesFromTMDB(fetchOptions);

    // Filter out current user's watched/rated movies
    const filtered = movies.filter((movie) => !excludeIds.has(movie.id));

    if (filtered.length > 0) {
      return filtered[Math.floor(Math.random() * filtered.length)];
    }

    // If no movies found with current filters, try without genre filter
    const fallback = await fetchMoviesFromTMDB({
      page: Math.floor(Math.random() * 5) + 1,
      limit: 20
    });

    const fallbackFiltered = fallback.filter((movie) => !excludeIds.has(movie.id));

    return fallbackFiltered.length > 0
      ? fallbackFiltered[Math.floor(Math.random() * fallbackFiltered.length)]
      : null;
  } catch (error) {
    console.error("Error getting next movie for taste match with friend:", error.message);
    return null;
  }
}

module.exports = {
  fetchGenres,
  getGenreNames,
  fetchMoviesFromTMDB,
  fetchMovieDetail,
  filterMovies,
  getNextMovieForTasteMatch,
  getFriendTopGenres,
  getNextMovieForTasteMatchWithFriend
};
