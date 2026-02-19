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

    // Fetch original movie details and credits
    const [movieDetailsResponse, creditsResponse] = await Promise.all([
      axios.get(`${TMDB_BASE}/movie/${tmdbId}`, {
        params: { api_key: apiKey }
      }),
      axios.get(`${TMDB_BASE}/movie/${tmdbId}/credits`, {
        params: { api_key: apiKey }
      })
    ]);

    const movieData = movieDetailsResponse.data;
    const creditsData = creditsResponse.data;

    // Extract reference movie attributes
    const refGenreIds = (movieData.genres || []).map(g => g.id);
    const refLanguage = movieData.original_language;
    
    // Extract directors (top 2)
    const refDirectors = creditsData.crew
      .filter(p => p.job === "Director")
      .map(p => p.id)
      .slice(0, 2);
    
    // Extract lead actors (top 5)
    const refActors = creditsData.cast
      .slice(0, 5)
      .map(p => p.id);
    
    // Extract writers (screenplay/story)
    const refWriters = creditsData.crew
      .filter(p => ["Screenplay", "Story", "Writer"].includes(p.job))
      .map(p => p.id)
      .slice(0, 3);

    console.log(`[SUGGESTIONS] Ref - Genres: ${refGenreIds}, Lang: ${refLanguage}, Directors: ${refDirectors}, Writers: ${refWriters}`);

    // Fetch candidate movies based on multiple criteria
    const [similarResponse, genreResponse, directorResponse, languageResponse] = await Promise.all([
      // Similar movies
      axios.get(`${TMDB_BASE}/movie/${tmdbId}/similar`, {
        params: {
          api_key: apiKey,
          page: 1
        }
      }),
      // Movies from same genres (high priority)
      axios.get(`${TMDB_BASE}/discover/movie`, {
        params: {
          api_key: apiKey,
          with_genres: refGenreIds.join(","),
          sort_by: "vote_average.desc",
          page: 1
        }
      }),
      // Movies from same directors
      axios.get(`${TMDB_BASE}/discover/movie`, {
        params: {
          api_key: apiKey,
          with_crew: refDirectors.join(","),
          sort_by: "vote_average.desc",
          page: 1
        }
      }),
      // Movies in same language
      axios.get(`${TMDB_BASE}/discover/movie`, {
        params: {
          api_key: apiKey,
          with_original_language: refLanguage,
          sort_by: "vote_average.desc",
          page: 1
        }
      })
    ]);

    // Combine all results
    const candidateMovies = [
      ...(similarResponse.data.results || []),
      ...(genreResponse.data.results || []),
      ...(directorResponse.data.results || []),
      ...(languageResponse.data.results || [])
    ];

    // Scoring function - ranks movies by similarity to reference
    const scoreMovie = (candidate) => {
      if (candidate.id === tmdbId) return -1; // Exclude original movie

      let score = 0;

      // Genre match (60% weight) - HIGHEST PRIORITY
      if (candidate.genre_ids && candidate.genre_ids.length > 0) {
        const commonGenres = candidate.genre_ids.filter(g => refGenreIds.includes(g)).length;
        const totalGenres = new Set([...candidate.genre_ids, ...refGenreIds]).size;
        const genreScore = totalGenres > 0 ? (commonGenres / totalGenres) * 100 : 0;
        score += genreScore * 0.6;
      }

      // Language match (15% weight) - VERY IMPORTANT
      const languageScore = candidate.original_language === refLanguage ? 100 : 0;
      score += languageScore * 0.15;

      // Director match (10% weight)
      // Note: We don't have director info in discover results, but use as tiebreaker
      score += 0 * 0.1; // Will be enhanced if director data available

      // Popularity & Rating tiebreaker (15% weight)
      const popularityScore = Math.min((candidate.popularity || 0) / 100, 1) * 100;
      const ratingScore = (candidate.vote_average || 0) * 10;
      score += ((popularityScore + ratingScore) / 2) * 0.15;

      return score;
    };

    // Remove duplicates and score
    const movieMap = new Map();
    for (const movie of candidateMovies) {
      if (!movieMap.has(movie.id)) {
        const score = scoreMovie(movie);
        if (score >= 30) { // Minimum similarity threshold
          movieMap.set(movie.id, { ...movie, similarityScore: score });
        }
      }
    }

    // Sort by similarity score
    const rankedMovies = Array.from(movieMap.values())
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 20); // Return top 20

    const suggestions = rankedMovies.map((movie) => ({
      id: movie.id,
      tmdb_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      year: movie.release_date ? movie.release_date.split("-")[0] : "",
      overview: movie.overview || "",
      vote_average: movie.vote_average || 0,
      popularity: movie.popularity || 0,
      genre_ids: movie.genre_ids || [],
      similarityScore: Math.round(movie.similarityScore)
    }));

    console.log(`[SUGGESTIONS] Returning ${suggestions.length} suggestions with scores`);
    console.log(`[SUGGESTIONS] Top match: ${suggestions[0]?.title} (${suggestions[0]?.similarityScore}%)`);
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

// Get smart suggestions for an entire profile (array of movie IDs)
const getSmartSuggestionsForProfile = async (tmdbIds) => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY is required");
  }

  if (!Array.isArray(tmdbIds) || tmdbIds.length === 0) {
    throw new Error("tmdbIds must be a non-empty array");
  }

  try {
    console.log(`[PROFILE-SUGGESTIONS] Fetching suggestions for profile with ${tmdbIds.length} movies`);

    // Fetch all reference movies' details and credits in parallel
    const moviePromises = tmdbIds.slice(0, 10).map(id => // Limit to 10 movies to avoid too many requests
      Promise.all([
        axios.get(`${TMDB_BASE}/movie/${id}`, { params: { api_key: apiKey } }).catch(() => null),
        axios.get(`${TMDB_BASE}/movie/${id}/credits`, { params: { api_key: apiKey } }).catch(() => null)
      ])
    );

    const movieDataPairs = await Promise.all(moviePromises);

    // Aggregate profile attributes
    const profileGenreIds = new Set();
    const profileLanguages = {};
    const profileDirectors = new Set();
    const profileActors = new Set();
    const profileWriters = new Set();

    for (const [detailsResp, creditsResp] of movieDataPairs) {
      if (!detailsResp || !creditsResp) continue;

      const movieData = detailsResp.data;
      const creditsData = creditsResp.data;

      // Aggregate genres
      (movieData.genres || []).forEach(g => profileGenreIds.add(g.id));

      // Track languages
      const lang = movieData.original_language;
      profileLanguages[lang] = (profileLanguages[lang] || 0) + 1;

      // Aggregate directors
      creditsData.crew
        .filter(p => p.job === "Director")
        .slice(0, 2)
        .forEach(p => profileDirectors.add(p.id));

      // Aggregate lead actors
      creditsData.cast
        .slice(0, 5)
        .forEach(p => profileActors.add(p.id));

      // Aggregate writers
      creditsData.crew
        .filter(p => ["Screenplay", "Story", "Writer"].includes(p.job))
        .slice(0, 3)
        .forEach(p => profileWriters.add(p.id));
    }

    const profileGenreIdsArray = Array.from(profileGenreIds);
    const primaryLanguage = Object.entries(profileLanguages).sort((a, b) => b[1] - a[1])[0]?.[0];
    const profileDirectorsArray = Array.from(profileDirectors).slice(0, 5);

    console.log(`[PROFILE-SUGGESTIONS] Profile - Genres: ${profileGenreIdsArray}, Primary Lang: ${primaryLanguage}`);

    // Fetch candidate movies based on profile
    const discoverParams = {
      api_key: apiKey,
      sort_by: "vote_average.desc",
      page: 1,
      with_original_language: primaryLanguage
    };

    if (profileGenreIdsArray.length > 0) {
      discoverParams.with_genres = profileGenreIdsArray.slice(0, 5).join(","); // TMDB limit
    }

    const [genreResponse, languageResponse] = await Promise.all([
      axios.get(`${TMDB_BASE}/discover/movie`, { params: discoverParams }),
      axios.get(`${TMDB_BASE}/discover/movie`, {
        params: {
          api_key: apiKey,
          with_original_language: primaryLanguage,
          sort_by: "vote_average.desc",
          page: 1
        }
      })
    ]);

    // Combine results
    const candidateMovies = [
      ...(genreResponse.data.results || []),
      ...(languageResponse.data.results || [])
    ];

    // Scoring function
    const scoreMovie = (candidate) => {
      // Skip if already in user's taste
      if (tmdbIds.includes(candidate.id)) return -1;

      let score = 0;

      // Genre match (60% weight)
      if (candidate.genre_ids && candidate.genre_ids.length > 0) {
        const commonGenres = candidate.genre_ids.filter(g => profileGenreIdsArray.includes(g)).length;
        const totalGenres = new Set([...candidate.genre_ids, ...profileGenreIdsArray]).size;
        const genreScore = totalGenres > 0 ? (commonGenres / totalGenres) * 100 : 0;
        score += genreScore * 0.6;
      }

      // Language match (15% weight)
      const languageScore = candidate.original_language === primaryLanguage ? 100 : 0;
      score += languageScore * 0.15;

      // Popularity & Rating tiebreaker (15% weight)
      const popularityScore = Math.min((candidate.popularity || 0) / 100, 1) * 100;
      const ratingScore = (candidate.vote_average || 0) * 10;
      score += ((popularityScore + ratingScore) / 2) * 0.15;

      return score;
    };

    // Remove duplicates and score
    const movieMap = new Map();
    for (const movie of candidateMovies) {
      if (!movieMap.has(movie.id)) {
        const score = scoreMovie(movie);
        if (score >= 30) {
          movieMap.set(movie.id, { ...movie, similarityScore: score });
        }
      }
    }

    // Sort by similarity score
    const rankedMovies = Array.from(movieMap.values())
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 20);

    const suggestions = rankedMovies.map((movie) => ({
      id: movie.id,
      tmdb_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      year: movie.release_date ? movie.release_date.split("-")[0] : "",
      overview: movie.overview || "",
      vote_average: movie.vote_average || 0,
      popularity: movie.popularity || 0,
      genre_ids: movie.genre_ids || [],
      similarityScore: Math.round(movie.similarityScore)
    }));

    console.log(`[PROFILE-SUGGESTIONS] Returning ${suggestions.length} suggestions`);
    return suggestions;
  } catch (error) {
    console.error("[PROFILE-SUGGESTIONS] Error:", error.message);
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
  getSmartSuggestionsForProfile,
  getMoviesByPreference
};
