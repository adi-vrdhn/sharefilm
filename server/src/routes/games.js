const express = require("express");
const axios = require("axios");

const router = express.Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Get random movies for guess the movie game
router.get("/api/games/guess-the-movie/random", async (req, res) => {
  try {
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: "TMDB API key not configured" });
    }

    const { language = "en", yearFrom = 1900, yearTo = new Date().getFullYear() } = req.query;
    // Fetch from pages 1-50 for much more diverse movie selection
    // Randomize heavily to avoid same movies showing up repeatedly
    const popularPage = Math.floor(Math.random() * 50) + 1;

    // Language to TMDB language code mapping
    const languageMap = {
      en: "en",
      es: "es",
      fr: "fr",
      de: "de",
      it: "it",
      pt: "pt",
      ja: "ja",
      ko: "ko",
      hi: "hi",
      te: "te",
      ta: "ta",
      ml: "ml",
      kn: "kn",
      bn: "bn"
    };

    const langCode = languageMap[language] || "en";

    // For Indian languages, use lower vote thresholds due to smaller catalog
    const isIndianLanguage = ["hi", "te", "ta", "ml", "kn", "bn"].includes(language);
    const voteCountThreshold = isIndianLanguage ? 100 : 300;
    const ratingThreshold = isIndianLanguage ? 5.0 : 5.5;

    // Fetch movies with FAMOUS ACTORS (high vote count = famous/well-known)
    // Sort by popularity for variety, not just box office
    const moviesResponse = await axios.get(
      `${TMDB_BASE_URL}/discover/movie`,
      {
        params: {
          api_key: TMDB_API_KEY,
          with_original_language: langCode,
          sort_by: "popularity.desc",
          "vote_count.gte": voteCountThreshold, // Lower threshold for Indian languages
          "vote_average.gte": ratingThreshold,
          page: popularPage,
          // Removed region filter - too restrictive for TMDB's Indian movie data
          ...(yearFrom && { "primary_release_date.gte": `${yearFrom}-01-01` }),
          ...(yearTo && { "primary_release_date.lte": `${yearTo}-12-31` })
        }
      }
    );

    if (!moviesResponse.data.results.length) {
      return res.status(404).json({ error: "No movies found for selected filters" });
    }

    const randomMovie = moviesResponse.data.results[
      Math.floor(Math.random() * moviesResponse.data.results.length)
    ];

    // Get credits (cast) for the movie
    const creditsResponse = await axios.get(
      `${TMDB_BASE_URL}/movie/${randomMovie.id}/credits?api_key=${TMDB_API_KEY}`
    );

    const topCast = creditsResponse.data.cast.slice(0, 5);

    if (topCast.length < 2) {
      // If not enough cast, try another movie from results instead of failing
      const availableMovies = moviesResponse.data.results.filter(async (movie) => {
        try {
          const credits = await axios.get(
            `${TMDB_BASE_URL}/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}`
          );
          return credits.data.cast.length >= 2;
        } catch {
          return false;
        }
      });

      if (availableMovies.length > 0) {
        const fallbackMovie = availableMovies[Math.floor(Math.random() * availableMovies.length)];
        const fallbackCredits = await axios.get(
          `${TMDB_BASE_URL}/movie/${fallbackMovie.id}/credits?api_key=${TMDB_API_KEY}`
        );
        const fallbackCast = fallbackCredits.data.cast.slice(0, 5);
        
        return res.status(200).json({
          id: fallbackMovie.id,
          title: fallbackMovie.title,
          poster_path: fallbackMovie.poster_path,
          release_date: fallbackMovie.release_date,
          overview: fallbackMovie.overview,
          rating: fallbackMovie.vote_average,
          genres: fallbackMovie.genres || [],
          cast: fallbackCast.map((actor) => ({
            id: actor.id,
            name: actor.name,
            profile_path: actor.profile_path,
            character: actor.character,
          })),
        });
      }

      // If still no valid movie, try fetching from a different page
      return res.status(404).json({ error: "No movies with cast found. Please try again!" });
    }

    res.json({
      id: randomMovie.id,
      title: randomMovie.title,
      poster_path: randomMovie.poster_path,
      release_date: randomMovie.release_date,
      overview: randomMovie.overview,
      rating: randomMovie.vote_average,
      genres: randomMovie.genres || [], // Include genres for feature matching
      cast: topCast.map((actor) => ({
        id: actor.id,
        name: actor.name,
        profile_path: actor.profile_path,
        character: actor.character,
      })),
    });
  } catch (error) {
    console.error("Error fetching random movie:", error.message);
    res.status(500).json({ error: "Failed to fetch movie" });
  }
});

// Search movies for guessing game
router.get("/api/games/guess-the-movie/search", async (req, res) => {
  try {
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: "TMDB API key not configured" });
    }

    const { query, language = "en" } = req.query;

    if (!query || query.length < 2) {
      return res.json({ results: [] });
    }

    const searchResponse = await axios.get(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=${language}`
    );

    // Fetch full details for top 8 results to get genre data for points system
    const topResults = searchResponse.data.results.slice(0, 8);
    const resultsWithGenres = await Promise.all(
      topResults.map(async (movie) => {
        try {
          const detailsResponse = await axios.get(
            `${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}`
          );
          return {
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            year: new Date(movie.release_date).getFullYear(),
            genres: detailsResponse.data.genres || [], // Full genre data for matching
          };
        } catch (error) {
          // Fallback if detail fetch fails
          return {
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            year: new Date(movie.release_date).getFullYear(),
            genres: [],
          };
        }
      })
    );

    res.json({ results: resultsWithGenres });
  } catch (error) {
    console.error("Error searching movies:", error.message);
    res.status(500).json({ error: "Failed to search movies" });
  }
});

module.exports = router;

