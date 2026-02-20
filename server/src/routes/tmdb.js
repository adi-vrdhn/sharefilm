const express = require("express");
const axios = require("axios");

const router = express.Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

/**
 * GET /api/tmdb/genres
 * Get list of movie genres
 */
router.get("/genres", async (req, res) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`
    );

    res.json({
      success: true,
      data: {
        genres: response.data.genres || [],
      },
    });
  } catch (error) {
    console.error("Error fetching genres:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch genres",
      error: error.message,
    });
  }
});

/**
 * GET /api/tmdb/search
 * Search for movies
 */
router.get("/search", async (req, res) => {
  try {
    const { query, page = 1 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "query parameter is required",
      });
    }

    const response = await axios.get(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
        query
      )}&page=${page}`
    );

    res.json({
      success: true,
      data: {
        results: response.data.results || [],
        total_results: response.data.total_results,
        total_pages: response.data.total_pages,
      },
    });
  } catch (error) {
    console.error("Error searching movies:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search movies",
      error: error.message,
    });
  }
});

/**
 * GET /api/tmdb/movie/:id
 * Get movie details
 */
router.get("/movie/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,watch/providers`
    );

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("Error fetching movie details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch movie details",
      error: error.message,
    });
  }
});

/**
 * GET /api/tmdb/trending
 * Get trending movies
 */
router.get("/trending", async (req, res) => {
  try {
    const { time_window = "week" } = req.query;

    const response = await axios.get(
      `${TMDB_BASE_URL}/trending/movie/${time_window}?api_key=${TMDB_API_KEY}`
    );

    res.json({
      success: true,
      data: {
        results: response.data.results || [],
      },
    });
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trending movies",
      error: error.message,
    });
  }
});

module.exports = router;
