const axios = require("axios");

const TMDB_BASE = "https://api.themoviedb.org/3";
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

const searchMovies = async (query) => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY is required");
  }

  const response = await axios.get(`${TMDB_BASE}/search/movie`, {
    params: {
      api_key: apiKey,
      query
    }
  });

  return response.data.results.map((movie) => ({
    tmdb_id: movie.id,
    title: movie.title,
    poster: movie.poster_path ? `${POSTER_BASE}${movie.poster_path}` : "",
    year: movie.release_date ? movie.release_date.split("-")[0] : ""
  }));
};

const getPopularMovies = async () => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY is required");
  }

  const response = await axios.get(`${TMDB_BASE}/movie/popular`, {
    params: {
      api_key: apiKey,
      page: 1
    }
  });

  return response.data.results.slice(0, 20).map((movie) => ({
    tmdb_id: movie.id,
    title: movie.title,
    poster: movie.poster_path ? `${POSTER_BASE}${movie.poster_path}` : "",
    year: movie.release_date ? movie.release_date.split("-")[0] : ""
  }));
};

const getMovieDetails = async (tmdbId) => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY is required");
  }

  const response = await axios.get(`${TMDB_BASE}/movie/${tmdbId}`, {
    params: {
      api_key: apiKey
    }
  });

  const movie = response.data;
  return {
    tmdb_id: movie.id,
    title: movie.title,
    poster: movie.poster_path ? `${POSTER_BASE}${movie.poster_path}` : "",
    backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : "",
    year: movie.release_date ? movie.release_date.split("-")[0] : "",
    overview: movie.overview || "No overview available",
    rating: movie.vote_average || 0,
    runtime: movie.runtime || 0,
    genres: movie.genres ? movie.genres.map(g => g.name).join(", ") : "",
    releaseDate: movie.release_date || ""
  };
};

module.exports = {
  searchMovies,
  getPopularMovies,
  getMovieDetails
};
