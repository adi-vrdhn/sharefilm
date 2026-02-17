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
    const isIndianLanguage = ["hi", "te", "ta", "ml", "kn", "bn"].includes(language);

    // Helper function to fetch movie with valid cast
    const fetchMovieWithCast = async (params) => {
      try {
        const moviesResponse = await axios.get(
          `${TMDB_BASE_URL}/discover/movie`,
          { params }
        );

        if (!moviesResponse.data.results.length) {
          return null;
        }

        // Try to find first movie with sufficient cast
        for (const movie of moviesResponse.data.results) {
          try {
            const creditsResponse = await axios.get(
              `${TMDB_BASE_URL}/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}`
            );
            const topCast = creditsResponse.data.cast.slice(0, 5);

            if (topCast.length >= 2) {
              return {
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
                release_date: movie.release_date,
                overview: movie.overview,
                rating: movie.vote_average,
                genres: movie.genres || [],
                cast: topCast.map((actor) => ({
                  id: actor.id,
                  name: actor.name,
                  profile_path: actor.profile_path,
                  character: actor.character,
                })),
              };
            }
          } catch (error) {
            // Skip this movie and try next
            continue;
          }
        }

        return null;
      } catch (error) {
        return null;
      }
    };

    // Strategy 1: Try with original language and low thresholds
    let movie = null;

    // For Indian languages, randomize page heavily (1-500)
    if (isIndianLanguage) {
      const randomPage = Math.floor(Math.random() * 500) + 1; // Random page 1-500
      const params = {
        api_key: TMDB_API_KEY,
        with_original_language: langCode,
        sort_by: "popularity.desc",
        "vote_count.gte": 50, // Very low threshold for Indian content
        "vote_average.gte": 4.5,
        page: randomPage, // Use random page, not sequential
        ...(yearFrom && { "primary_release_date.gte": `${yearFrom}-01-01` }),
        ...(yearTo && { "primary_release_date.lte": `${yearTo}-12-31` })
      };

      movie = await fetchMovieWithCast(params);

      // Strategy 2: If failed on random page, try different random pages (not sequential)
      if (!movie) {
        for (let i = 0; i < 10; i++) { // Try 10 different random pages
          const randomPage2 = Math.floor(Math.random() * 500) + 1;
          const params2 = {
            api_key: TMDB_API_KEY,
            with_original_language: langCode,
            sort_by: "popularity.desc",
            "vote_count.gte": 30,
            "vote_average.gte": 4.0,
            page: randomPage2,
            ...(yearFrom && { "primary_release_date.gte": `${yearFrom}-01-01` }),
            ...(yearTo && { "primary_release_date.lte": `${yearTo}-12-31` })
          };
          movie = await fetchMovieWithCast(params2);
          if (movie) break;
        }
      }

      // Strategy 3: If still failed, try NO vote threshold at all for Indian languages
      if (!movie) {
        const randomPage3 = Math.floor(Math.random() * 300) + 1;
        const params3 = {
          api_key: TMDB_API_KEY,
          with_original_language: langCode,
          sort_by: "popularity.desc",
          page: randomPage3,
          ...(yearFrom && { "primary_release_date.gte": `${yearFrom}-01-01` }),
          ...(yearTo && { "primary_release_date.lte": `${yearTo}-12-31` })
        };
        movie = await fetchMovieWithCast(params3);
      }

      // Strategy 4: Last resort - fetch any movie in that language from random page
      if (!movie) {
        const randomPage4 = Math.floor(Math.random() * 100) + 1;
        const params4 = {
          api_key: TMDB_API_KEY,
          with_original_language: langCode,
          sort_by: "popularity.desc",
          page: randomPage4
        };
        movie = await fetchMovieWithCast(params4);
      }
    } else {
      // For non-Indian languages, randomize pages 1-100
      const randomPage = Math.floor(Math.random() * 100) + 1; // Random page 1-100
      const params = {
        api_key: TMDB_API_KEY,
        with_original_language: langCode,
        sort_by: "popularity.desc",
        "vote_count.gte": 300,
        "vote_average.gte": 5.5,
        page: randomPage,
        ...(yearFrom && { "primary_release_date.gte": `${yearFrom}-01-01` }),
        ...(yearTo && { "primary_release_date.lte": `${yearTo}-12-31` })
      };

      movie = await fetchMovieWithCast(params);

      // Fallback for non-Indian with random pages
      if (!movie) {
        for (let i = 0; i < 10; i++) {
          const randomPage2 = Math.floor(Math.random() * 100) + 1;
          const params2 = {
            api_key: TMDB_API_KEY,
            with_original_language: langCode,
            sort_by: "popularity.desc",
            "vote_count.gte": 100,
            "vote_average.gte": 5.0,
            page: randomPage2,
            ...(yearFrom && { "primary_release_date.gte": `${yearFrom}-01-01` }),
            ...(yearTo && { "primary_release_date.lte": `${yearTo}-12-31` })
          };
          movie = await fetchMovieWithCast(params2);
          if (movie) break;
        }
      }
    }

    if (!movie) {
      return res.status(404).json({ 
        error: `No movies found for ${language}. Try a different language or year range.` 
      });
    }

    res.json(movie);
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

