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
    // Fetch from TOP pages only (pages 1-2) for most popular movies
    const popularPage = Math.random() > 0.7 ? 2 : 1; // 70% page 1, 30% page 2

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

    // Fetch POPULAR & HIGHLY RATED movies (box office winners)
    const moviesResponse = await axios.get(
      `${TMDB_BASE_URL}/discover/movie`,
      {
        params: {
          api_key: TMDB_API_KEY,
          with_original_language: langCode,
          sort_by: "revenue.desc",
          "vote_count.gte": 500, // Only movies with 500+ votes (popular & trusted)
          "vote_average.gte": 6.0, // Only highly rated movies
          page: popularPage,
          region: language === "hi" || language === "te" || language === "ta" || language === "ml" || language === "kn" || language === "bn" ? "IN" : undefined,
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
      // If not enough cast, just return an error - user can try again
      return res.status(404).json({ error: "Movie doesn't have enough cast information. Try again!" });
    }

    res.json({
      id: randomMovie.id,
      title: randomMovie.title,
      poster_path: randomMovie.poster_path,
      release_date: randomMovie.release_date,
      overview: randomMovie.overview,
      rating: randomMovie.vote_average,
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

    const results = searchResponse.data.results.slice(0, 8).map((movie) => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      year: new Date(movie.release_date).getFullYear(),
    }));

    res.json({ results });
  } catch (error) {
    console.error("Error searching movies:", error.message);
    res.status(500).json({ error: "Failed to search movies" });
  }
});

module.exports = router;

