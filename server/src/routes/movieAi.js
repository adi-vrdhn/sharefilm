const express = require('express');
const axios = require('axios');
const { verifyToken } = require('../middleware/authMiddleware');
const {
  parseMovieRequest,
  buildTmdbQuery,
  verifyOllamaConnection,
} = require('../services/ollamaService');

const router = express.Router();
const tmdbApiKey = process.env.TMDB_API_KEY;
const tmdbBaseUrl = 'https://api.themoviedb.org/3';

// Store conversation history in memory (per user per session)
// In production, store in database
const conversationStore = {};

/**
 * GET /api/movie-ai/verify
 * Check if Ollama is running and ready
 */
router.get('/verify', async (req, res) => {
  try {
    const status = await verifyOllamaConnection();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Verification failed', details: error.message });
  }
});

/**
 * POST /api/movie-ai/chat
 * Main chat endpoint - user sends prompt, get movie recommendations
 */
router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (message.length > 500) {
      return res.status(400).json({ error: 'Message too long (max 500 chars)' });
    }

    // Initialize or get conversation history
    const key = `${userId}_${conversationId || 'default'}`;
    if (!conversationStore[key]) {
      conversationStore[key] = [];
    }

    const history = conversationStore[key];

    // Parse user request with Ollama
    const parsed = await parseMovieRequest(message, history);

    if (!parsed.success && history.length === 0) {
      // If first message and Ollama failed, return error
      return res.status(500).json({
        error:
          'Failed to understand your request. Is Ollama running? (ollama serve)',
        hint: 'Make sure Ollama is running locally on localhost:11434',
      });
    }

    // Build TMDB query
    const tmbdQuery = buildTmdbQuery(parsed);
    const movieResponse = await axios.get(
      `${tmdbBaseUrl}/discover/movie?${tmbdQuery}&api_key=${tmdbApiKey}`
    );

    const movies = movieResponse.data.results.slice(0, 5).map((movie) => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      rating: movie.vote_average,
      release_year: movie.release_date?.split('-')[0],
      synopsis: movie.overview,
      genres: parsed.genres, // Include extracted genres
    }));

    // Store messages in conversation history
    history.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    history.push({
      role: 'assistant',
      content: parsed.explanation,
      timestamp: new Date(),
    });

    // Keep only last 20 messages to avoid memory bloat
    if (history.length > 20) {
      conversationStore[key] = history.slice(-20);
    }

    res.json({
      aiResponse: parsed.explanation,
      movies: movies,
      conversationId: key,
      messageCount: history.length,
    });
  } catch (error) {
    console.error('Chat error:', error.message);

    if (error.message.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: 'Ollama is not running. Start it with: ollama serve',
      });
    }

    res.status(500).json({
      error: 'Failed to process request',
      details: error.message,
    });
  }
});

/**
 * POST /api/movie-ai/clear-history
 * Clear conversation history for a user
 */
router.post('/clear-history', verifyToken, (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user.id;
    const key = `${userId}_${conversationId || 'default'}`;

    if (conversationStore[key]) {
      delete conversationStore[key];
    }

    res.json({ message: 'Conversation history cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

/**
 * GET /api/movie-ai/history/:conversationId
 * Get conversation history (optional - for debugging)
 */
router.get('/history/:conversationId', verifyToken, (req, res) => {
  try {
    const userId = req.user.id;
    const key = `${userId}_${req.params.conversationId || 'default'}`;

    const history = conversationStore[key] || [];

    // Return only user and assistant messages, not full details
    const simplifiedHistory = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    res.json({
      conversationId: key,
      messageCount: history.length,
      messages: simplifiedHistory,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
