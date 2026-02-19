const axios = require('axios');

const OLLAMA_API = process.env.OLLAMA_API || 'http://localhost:11434/api';

/**
 * Call Ollama to parse user prompt and extract movie preferences
 * @param {string} userMessage - User's natural language prompt
 * @param {array} conversationHistory - Previous messages for context
 * @returns {object} Parsed movie filters and AI response
 */
async function parseMovieRequest(userMessage, conversationHistory = []) {
  try {
    // Build context from conversation history
    const contextMessages = conversationHistory
      .slice(-4) // Keep last 4 messages for context
      .map(
        (msg) =>
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      )
      .join('\n');

    const systemPrompt = `You are a movie recommendation AI. Your job is to understand what kind of movies the user wants based on their natural language request.

IMPORTANT: You MUST respond in VALID JSON format with this exact structure:
{
  "genres": ["genre1", "genre2"],
  "keywords": ["keyword1", "keyword2"],
  "mood": "description of mood/vibe",
  "explanation": "Your natural language explanation to show to the user"
}

Guidelines:
- genres: Include relevant movie genres (animation, action, comedy, crime, documentary, drama, family, fantasy, history, horror, music, mystery, romance, science_fiction, thriller, tv_movie, war, western)
- keywords: Include specific themes, settings, actors, or plot elements (e.g., "new york", "exam stress", "time travel", "superhero")
- mood: Describe the vibe in 1-2 sentences (e.g., "light-hearted and uplifting", "dark and intense")
- explanation: Your friendly recommendation message to the user (1-2 sentences)

Previous conversation:
${contextMessages || '(First message)'}

User message: "${userMessage}"

Respond ONLY with valid JSON, nothing else.`;

    const response = await axios.post(
      `${OLLAMA_API}/generate`,
      {
        model: 'llama3:8b',
        prompt: systemPrompt,
        stream: false,
        temperature: 0.7,
      },
      { timeout: 60000 }
    );

    let responseText = response.data.response.trim();

    // Try to extract JSON if wrapped in other text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }

    const parsed = JSON.parse(responseText);

    return {
      success: true,
      genres: parsed.genres || [],
      keywords: parsed.keywords || [],
      mood: parsed.mood || '',
      explanation: parsed.explanation || userMessage,
    };
  } catch (error) {
    console.error('Ollama parsing error:', error.message);

    // Fallback: Simple keyword extraction if Ollama fails
    return {
      success: false,
      genres: extractGenresFromText(userMessage),
      keywords: extractKeywordsFromText(userMessage),
      mood: 'any',
      explanation:
        'I understood your request. Let me find movies for you...',
    };
  }
}

/**
 * Fallback: Extract genres from user text (keyword matching)
 */
function extractGenresFromText(text) {
  const genreKeywords = {
    animation: ['animated', 'cartoon', 'anime'],
    action: ['action', 'fight', 'explosive', 'chase'],
    comedy: ['funny', 'laugh', 'comedy', 'hilarious'],
    crime: ['crime', 'murder', 'detective', 'heist'],
    documentary: ['documentary', 'real'],
    drama: ['drama', 'emotional', 'intense'],
    family: ['family', 'kids', 'children'],
    fantasy: ['fantasy', 'magic', 'wizard', 'dragon'],
    history: ['history', 'historical', 'period'],
    horror: ['horror', 'scary', 'terror', 'ghost'],
    music: ['music', 'musical', 'concert'],
    mystery: ['mystery', 'puzzle', 'unknown'],
    romance: ['romance', 'romantic', 'love'],
    science_fiction: ['sci-fi', 'scifi', 'space', 'future', 'alien'],
    thriller: ['thriller', 'suspense', 'tension'],
    war: ['war', 'battle', 'military'],
  };

  const lowerText = text.toLowerCase();
  const genres = [];

  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      genres.push(genre);
    }
  }

  return genres.length > 0 ? genres : ['drama'];
}

/**
 * Fallback: Extract keywords from user text
 */
function extractKeywordsFromText(text) {
  // Extract words in quotes or common patterns
  const keywords = [];
  const quotes = text.match(/"([^"]*)"/g);

  if (quotes) {
    quotes.forEach((q) => keywords.push(q.replace(/"/g, '')));
  }

  // Extract location names (common cities/places)
  const places = text.match(/(?:in|at|set in|located in)\s+([A-Z][a-z]+)/gi);
  if (places) {
    places.forEach((p) => {
      const place = p.replace(/(?:in|at|set in|located in)\s+/i, '');
      keywords.push(place.toLowerCase());
    });
  }

  return keywords.slice(0, 5); // Limit to 5 keywords
}

/**
 * Build TMDB search query from parsed filters
 */
function buildTmdbQuery(filters) {
  const params = new URLSearchParams();

  if (filters.genres && filters.genres.length > 0) {
    params.append('with_genres', filters.genres.join('|'));
  }

  if (filters.keywords && filters.keywords.length > 0) {
    params.append('with_keywords', filters.keywords.join(','));
  }

  params.append('sort_by', 'popularity.desc');
  params.append('page', '1');
  params.append('with_runtime.gte', '70'); // Minimum 70 min
  params.append('with_runtime.lte', '180'); // Maximum 180 min

  return params.toString();
}

/**
 * Verify Ollama is running and accessible
 */
async function verifyOllamaConnection() {
  try {
    const response = await axios.get(`${OLLAMA_API}/tags`, {
      timeout: 5000,
    });
    const hasLlama = response.data.models?.some((m) =>
      m.name.includes('llama3')
    );

    if (hasLlama) {
      console.log('✅ Ollama connection verified. Llama3:8b available.');
      return { connected: true, model: 'llama3:8b' };
    } else {
      console.warn(
        '⚠️  Ollama running but llama3:8b not found. Please run: ollama pull llama3:8b'
      );
      return {
        connected: true,
        model: null,
        warning:
          'llama3:8b model not found. Pull it first: ollama pull llama3:8b',
      };
    }
  } catch (error) {
    console.error(
      '❌ Ollama connection failed. Make sure Ollama is running: ollama serve'
    );
    return {
      connected: false,
      error: error.message,
    };
  }
}

module.exports = {
  parseMovieRequest,
  buildTmdbQuery,
  verifyOllamaConnection,
};
