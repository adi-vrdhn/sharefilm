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

module.exports = {
  fetchGenres,
  getGenreNames,
  fetchMoviesFromTMDB,
  fetchMovieDetail,
  filterMovies,
  getNextMovieForTasteMatch
};
