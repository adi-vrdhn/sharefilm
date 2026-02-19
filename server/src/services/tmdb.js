const axios = require("axios");

const TMDB_BASE = "https://api.themoviedb.org/3";
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

const searchMovies = async (query) => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.error("TMDB_API_KEY not set in environment variables");
    throw new Error("TMDB_API_KEY is required - please check server environment variables");
  }

  try {
    console.log(`Searching TMDB for: "${query}"`);
    const response = await axios.get(`${TMDB_BASE}/search/movie`, {
      params: {
        api_key: apiKey,
        query,
        page: 1
      }
    });

    const results = response.data.results || [];
    console.log(`Found ${results.length} movies for "${query}"`);
    
    if (results.length === 0) {
      console.warn(`No results found for query: "${query}"`);
    }

    return results.map((movie) => ({
      tmdb_id: movie.id,
      id: movie.id,
      title: movie.title,
      poster: movie.poster_path ? `${POSTER_BASE}${movie.poster_path}` : "",
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      year: movie.release_date ? movie.release_date.split("-")[0] : "",
      overview: movie.overview,
      genre_ids: movie.genre_ids || [],
      original_language: movie.original_language
    }));
  } catch (error) {
    console.error("TMDB API search error:", {
      query,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
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

const getGenres = async () => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY is required");
  }

  const response = await axios.get(`${TMDB_BASE}/genre/movie/list`, {
    params: {
      api_key: apiKey
    }
  });

  return response.data.genres || [];
};

const getWatchProviders = async (region = "IN") => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY is required");
  }

  const response = await axios.get(`${TMDB_BASE}/watch/providers/movie`, {
    params: {
      api_key: apiKey,
      watch_region: region
    }
  });

  return response.data.results || [];
};

const discoverMovies = async ({
  genre,
  provider,
  language,
  page = 1,
  region = "IN"
}) => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY is required");
  }

  const genreValue = Array.isArray(genre) ? genre.filter(Boolean).join(",") : genre;

  const response = await axios.get(`${TMDB_BASE}/discover/movie`, {
    params: {
      api_key: apiKey,
      with_genres: genreValue || undefined,
      with_watch_providers: provider || undefined,
      watch_region: provider ? region : undefined,
      with_original_language: language || undefined,
      sort_by: "popularity.desc",
      page
    }
  });

  return (response.data.results || []).map((movie) => ({
    tmdb_id: movie.id,
    title: movie.title,
    poster: movie.poster_path ? `${POSTER_BASE}${movie.poster_path}` : "",
    year: movie.release_date ? movie.release_date.split("-")[0] : "",
    overview: movie.overview || "",
    rating: movie.vote_average || 0,
    genre_ids: movie.genre_ids || []
  }));
};

const getSimilarMovies = async (tmdbId) => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY is required");
  }

  const response = await axios.get(`${TMDB_BASE}/movie/${tmdbId}/similar`, {
    params: {
      api_key: apiKey,
      page: 1
    }
  });

  return (response.data.results || []).map((movie) => ({
    tmdb_id: movie.id,
    id: movie.id,
    title: movie.title,
    poster: movie.poster_path ? `${POSTER_BASE}${movie.poster_path}` : "",
    poster_path: movie.poster_path,
    year: movie.release_date ? movie.release_date.split("-")[0] : "",
    overview: movie.overview || "",
    rating: movie.vote_average || 0,
    genre_ids: movie.genre_ids || []
  }));
};

const getSmartSuggestions = async (tmdbId) => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY is required");
  }

  try {
    console.log(`[SUGGESTIONS] Fetching smart suggestions for movie ${tmdbId}`);

    // Fetch movie details and credits in parallel
    const movieDetailsResponse = await axios.get(`${TMDB_BASE}/movie/${tmdbId}`, {
      params: { api_key: apiKey }
    });

    const creditsResponse = await axios.get(`${TMDB_BASE}/movie/${tmdbId}/credits`, {
      params: { api_key: apiKey }
    });

    const movieData = movieDetailsResponse.data;
    const creditsData = creditsResponse.data;

    // Extract genres, directors, and lead actor(s)
    const genreIds = (movieData.genres || []).map(g => g.id);
    const directors = creditsData.crew
      .filter(p => p.job === "Director")
      .map(p => p.id)
      .slice(0, 2); // Top 2 directors
    const leadActors = creditsData.cast
      .slice(0, 3) // Top 3 lead actors
      .map(p => p.id);

    console.log(`[SUGGESTIONS] Genres: ${genreIds}, Directors: ${directors}, Actors: ${leadActors}`);

    // Fetch all suggestion types in parallel
    const [similarResponse, genreResponse, directorResponse, castResponse] = await Promise.all([
      // Similar movies
      axios.get(`${TMDB_BASE}/movie/${tmdbId}/similar`, {
        params: {
          api_key: apiKey,
          page: 1
        }
      }),
      // Movies from same genres
      axios.get(`${TMDB_BASE}/discover/movie`, {
        params: {
          api_key: apiKey,
          with_genres: genreIds.join(","),
          sort_by: "vote_average.desc",
          page: 1
        }
      }),
      // Movies from same directors
      axios.get(`${TMDB_BASE}/discover/movie`, {
        params: {
          api_key: apiKey,
          with_crew: directors.join(","),
          sort_by: "vote_average.desc",
          page: 1
        }
      }),
      // Movies with same cast
      axios.get(`${TMDB_BASE}/discover/movie`, {
        params: {
          api_key: apiKey,
          with_cast: leadActors.join(","),
          sort_by: "vote_average.desc",
          page: 1
        }
      })
    ]);

    // Combine all results with deduplication
    const allMovies = [
      ...(similarResponse.data.results || []),
      ...(genreResponse.data.results || []),
      ...(directorResponse.data.results || []),
      ...(castResponse.data.results || [])
    ];

    // Remove the original movie and duplicates
    const movieIds = new Set();
    const uniqueMovies = [];

    for (const movie of allMovies) {
      if (movie.id !== tmdbId && !movieIds.has(movie.id)) {
        movieIds.add(movie.id);
        uniqueMovies.push(movie);
      }
    }

    // Sort by rating and popularity
    uniqueMovies.sort((a, b) => {
      const ratingDiff = (b.vote_average || 0) - (a.vote_average || 0);
      if (Math.abs(ratingDiff) > 0.5) return ratingDiff;
      return (b.popularity || 0) - (a.popularity || 0);
    });

    // Return top 20
    const suggestions = uniqueMovies.slice(0, 20).map((movie) => ({
      id: movie.id,
      tmdb_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      year: movie.release_date ? movie.release_date.split("-")[0] : "",
      overview: movie.overview || "",
      vote_average: movie.vote_average || 0,
      popularity: movie.popularity || 0,
      genre_ids: movie.genre_ids || []
    }));

    console.log(`[SUGGESTIONS] Returning ${suggestions.length} suggestions`);
    return suggestions;
  } catch (error) {
    console.error("[SUGGESTIONS] Error fetching suggestions:", error.message);
    throw error;
  }
};


const getMoviesByPreference = async (languages, preference, genres) => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY is required");
  }

  try {
    console.log(`[PREFERENCE] Fetching movies - Languages: ${languages}, Preference: ${preference}, Genres: ${genres}`);

    let sortBy = "popularity.desc";
    let minVoteAverage = 0;
    let maxPopularity = 10000;
    let minPopularity = 0;

    // Configure based on preference type
    if (preference === "blockbuster") {
      // High popularity, big budget
      sortBy = "popularity.desc";
      minPopularity = 50; // Minimum popularity for blockbuster
      minVoteAverage = 6;
    } else if (preference === "niche") {
      // Low budget, high rating, less popularity
      sortBy = "vote_average.desc";
      minVoteAverage = 7.5; // High rating for quality niche films
      maxPopularity = 100; // Lower popularity
      minPopularity = 1;
    } else if (preference === "mixed") {
      // Both types
      sortBy = "popularity.desc";
      minPopularity = 10;
      minVoteAverage = 6;
    }

    // Format languages - convert to pipe-separated string for TMDB API
    const languageString = languages.join("|");

    // Format genres - TMDB needs genre IDs, but we're passing genre names
    // We'll just pass what we get for now
    const genreString = genres.join("|");

    const params = {
      api_key: apiKey,
      language: "en-US",
      sort_by: sortBy,
      page: 1,
      per_page: 20, // Get more to filter and return 15
      vote_average_gte: minVoteAverage,
      "vote_count.gte": 100 // Only movies with enough votes
    };

    // Add optional filters
    if (languageString) {
      params.with_original_language = languageString;
    }
    if (genreString) {
      params.with_genres = genreString;
    }

    const response = await axios.get(`${TMDB_BASE}/discover/movie`, {
      params
    });

    let movies = response.data.results || [];
    console.log(`[PREFERENCE] Found ${movies.length} movies from TMDB`);

    // Filter based on popularity constraints
    if (preference === "niche") {
      movies = movies.filter(m => m.popularity < 100);
    } else if (preference === "blockbuster") {
      movies = movies.filter(m => m.popularity > 50);
    }

    // Take top 15 movies
    movies = movies.slice(0, 15);

    console.log(`[PREFERENCE] Returning ${movies.length} movies`);

    return movies.map((movie) => ({
      tmdb_id: movie.id,
      id: movie.id,
      title: movie.title,
      poster: movie.poster_path ? `${POSTER_BASE}${movie.poster_path}` : "",
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      year: movie.release_date ? movie.release_date.split("-")[0] : "",
      overview: movie.overview,
      genre_ids: movie.genre_ids || [],
      original_language: movie.original_language,
      popularity: movie.popularity,
      vote_average: movie.vote_average
    }));
  } catch (error) {
    console.error("[PREFERENCE] Error fetching movies:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

const getMovieDetailsWithCrew = async (tmdbId) => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY is required");
  }

  try {
    // Fetch movie details and credits in parallel
    const [detailsResponse, creditsResponse] = await Promise.all([
      axios.get(`${TMDB_BASE}/movie/${tmdbId}`, {
        params: {
          api_key: apiKey
        }
      }),
      axios.get(`${TMDB_BASE}/movie/${tmdbId}/credits`, {
        params: {
          api_key: apiKey
        }
      })
    ]);

    const movie = detailsResponse.data;
    const credits = creditsResponse.data;

    // Extract directors from crew
    const directors = credits.crew
      .filter(person => person.job === 'Director')
      .map(person => person.name);

    // Extract cast (top 10)
    const cast = credits.cast
      .slice(0, 10)
      .map(person => person.name);

    // Get genre names
    const genre_names = movie.genres ? movie.genres.map(g => g.name) : [];

    return {
      tmdb_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      year: movie.release_date ? movie.release_date.split("-")[0] : "",
      overview: movie.overview || "No overview available",
      rating: movie.vote_average || 0,
      runtime: movie.runtime || 0,
      genres: movie.genre_ids || [],
      genre_names,
      directors,
      cast,
      release_date: movie.release_date,
      popularity: movie.popularity || 0
    };
  } catch (error) {
    console.error("Error fetching movie details with crew:", error.message);
    throw error;
  }
};

module.exports = {
  searchMovies,
  getPopularMovies,
  getMovieDetails,
  getMovieDetailsWithCrew,
  getGenres,
  getWatchProviders,
  discoverMovies,
  getSimilarMovies,
  getSmartSuggestions,
  getMoviesByPreference
};
