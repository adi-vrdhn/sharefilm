const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const {
  getRecommendations,
  updateUserTaste,
} = require("../services/recommendationEngine");

/**
 * GET /api/recommendations
 * Get personalized movie recommendations for the current user
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const recommendations = await getRecommendations(userId, limit);

    res.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length,
      },
    });
  } catch (error) {
    console.error("Recommendations endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate recommendations",
      error: error.message,
    });
  }
});

/**
 * POST /api/recommendations/learn
 * Update user taste vector based on a swipe action
 */
router.post("/learn", authenticateToken, async (req, res) => {
  try {
    const { tmdbId, action, genres = [], language = "en" } = req.body;
    const userId = req.user.id;

    if (!tmdbId || !action) {
      return res.status(400).json({
        success: false,
        message: "Missing tmdbId or action",
      });
    }

    await updateUserTaste(userId, tmdbId, action, genres, language);

    res.json({
      success: true,
      message: "Taste vector updated",
    });
  } catch (error) {
    console.error("Learn endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update taste vector",
      error: error.message,
    });
  }
});

module.exports = router;
