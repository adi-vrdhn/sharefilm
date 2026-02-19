# 🎬 Movie AI - Local Setup Guide

Your Movie AI chatbot is ready! It uses **Ollama** (local LLM) + **TMDB API** to provide intelligent movie recommendations based on natural language prompts.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [How It Works](#how-it-works)
4. [Testing](#testing)
5. [Features](#features)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Ollama Installation

#### macOS:
```bash
# Download from https://ollama.ai
# Or install via Homebrew
brew install ollama

# Pull the llama3:8b model (7.8 GB)
ollama pull llama3:8b
```

#### Linux:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3:8b
```

#### Windows:
- Download installer from https://ollama.ai
- Run installer
- Open PowerShell and run:
```powershell
ollama pull llama3:8b
```

### 2. Environment Variables
Make sure your `.env` file has:
```env
TMDB_API_KEY=your_tmdb_api_key
OLLAMA_API=http://localhost:11434/api  # Optional, defaults to this
```

---

## Quick Start

### Step 1: Start Ollama Server
```bash
# This will start Ollama on http://localhost:11434
ollama serve
```

You should see:
```
serving on 127.0.0.1:11434
```

### Step 2: Start Backend Server
In a new terminal:
```bash
cd server
npm start
# Backend runs on http://localhost:4000
```

### Step 3: Start Frontend
In another terminal:
```bash
cd client  
npm start
# Frontend runs on http://localhost:3000
```

### Step 4: Access Movie AI
1. Login to your account
2. Click **"Movie AI"** in the sidebar
3. Start asking for movie recommendations!

---

## How It Works

### Architecture Flow

```
User Prompt
    ↓
Ollama (llama3:8b)
    ↓
Parse Intent & Extract Filters
(genres, keywords, mood, etc.)
    ↓
Build TMDB Search Query
    ↓
TMDB API Discovery
    ↓
Format & Display Movie Cards
```

### Example Conversation

```
User:   "I am bored. I have an exam tomorrow. I want a romantic movie set in New York"

Ollama parses:
{
  "genres": ["romance", "drama"],
  "keywords": ["new york", "exam", "stress relief"],
  "mood": "light-hearted and uplifting",
  "explanation": "I found romantic NYC movies to lift your spirits before your exam!"
}

TMDB Query:
/discover/movie?with_genres=10749,18&with_keywords=new_york&sort_by=popularity.desc

Results: [
  "When Harry Met Sally...",
  "You've Got Mail",
  "Breakfast at Tiffany's",
  "The Phantom of the Opera",
  "Enchanted"
]
```

---

## Testing

### Test 1: Verify Ollama Connection
```bash
curl http://localhost:11434/api/tags
```

Expected output:
```json
{
  "models": [
    {
      "name": "llama3:8b:latest",
      ...
    }
  ]
}
```

### Test 2: Check Backend Endpoint
```bash
curl -X GET http://localhost:4000/api/movie-ai/verify
```

Expected output:
```json
{
  "connected": true,
  "model": "llama3:8b"
}
```

### Test 3: Send a Chat Message
```bash
curl -X POST http://localhost:4000/api/movie-ai/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want a romantic comedy",
    "conversationId": "test-session"
  }'
```

### Test 4: UI Testing
1. Go to Movie AI page
2. You should see Ollama status: "✅ Ollama ready" or "⚠️ Ollama not running"
3. Type a prompt like: "movies like Inception"
4. Click Send
5. Wait for AI response with 5 movie recommendations

---

## Features

### ✅ What's Implemented

- **Multi-turn Conversations**: AI remembers context for follow-ups
- **Natural Language Parsing**: Understands complex requests like "I am bored with a sci-fi vibe"
- **Smart Filtering**: Extracts genres, keywords, mood from prompts
- **Movie Cards**: Shows poster, rating, synopsis, TMDB link
- **Conversation History**: Keeps track per user session
- **Error Handling**: Fallback to keyword extraction if Ollama fails
- **Responsive UI**: Works on desktop and mobile
- **Loading States**: Visual feedback while AI thinks

### 🚀 Example Prompts You Can Try

1. **Generic**: "suggest some romance movies"
2. **Descriptive**: "I am bored. I have an exam tomorrow. I want a romantic movie set in New York"
3. **Comparative**: "movies like Inception but more romantic"
4. **Mood-based**: "a dark thriller that makes you think"
5. **Specific**: "animated movies for kids with adventure themes"
6. **Follow-up**: "show me something similar but lighter" (remembers context)

---

## Performance Tips

### Optimize Ollama
```bash
# Use GPU acceleration (if available)
CUDA_VISIBLE_DEVICES=0 ollama serve

# Or use CPU for testing
ollama serve --noimport

# Increase timeout if running slow
# Edit server/src/routes/movieAi.js
# Increase timeout from 60000 to 120000 (2 min)
```

### First Run
First request takes ~5-10 seconds while Ollama loads the model.
Subsequent requests: ~2-5 seconds.

### Memory Usage
- **Ollama process**: ~8GB RAM
- **llama3:8b model**: ~5GB VRAM/RAM
- Ensure your system has at least 16GB RAM

---

## Troubleshooting

### ❌ "Ollama is not running"
```bash
# Solution: Start Ollama in a new terminal
ollama serve

# Verify it's running
curl http://localhost:11434/api/tags
```

### ❌ "llama3:8b not found"
```bash
# Solution: Pull the model
ollama pull llama3:8b

# Check available models
ollama list
```

### ❌ TMDB API Key Error
Make sure your `.env` has:
```env
TMDB_API_KEY=your_actual_api_key_here
```
Don't use dummy values.

### ❌ "Connection refused" on port 11434
- Ollama not running → `ollama serve`
- Wrong port configured → Check `.env` OLLAMA_API value
- Firewall blocking → Allow localhost:11434

### ❌ AI Returns Irrelevant Movies
This is a tuning issue. The fallback keyword extraction isn't perfect.
Try:
- Being more specific in your prompt
- Using simpler language
- Including multiple relevant keywords

### ❌ Timeout After 60 Seconds
Ollama is taking too long. Either:
1. Your prompt is very long → Keep under 500 chars
2. System is slow → Upgrade hardware or close other apps
3. Increase timeout in `server/src/routes/movieAi.js`

### ❌ Memory Issues / Crashes
Ollama needs ~8GB RAM. If crashing:
```bash
# Use a smaller model
ollama pull neural-chat:7b  # Smaller, faster

# Then update movieAi.js service:
# Change: model: 'llama3:8b'
# To: model: 'neural-chat:7b'
```

---

## API Endpoints

### GET `/api/movie-ai/verify`
Check if Ollama is running.

**Response:**
```json
{
  "connected": true,
  "model": "llama3:8b"
}
```

### POST `/api/movie-ai/chat`
Send a message and get movie recommendations.

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request:**
```json
{
  "message": "I want a romantic movie",
  "conversationId": "optional-session-id"
}
```

**Response:**
```json
{
  "aiResponse": "Here are romantic movies I recommend...",
  "movies": [
    {
      "id": 155,
      "title": "The Notebook",
      "poster_path": "/xxx.jpg",
      "rating": 8.1,
      "release_year": "2004",
      "synopsis": "...",
      "genres": ["romance", "drama"]
    }
  ],
  "conversationId": "user123_session456",
  "messageCount": 1
}
```

### POST `/api/movie-ai/clear-history`
Clear conversation history.

**Response:**
```json
{
  "message": "Conversation history cleared"
}
```

### GET `/api/movie-ai/history/:conversationId`
Get conversation history (for debugging).

---

## Production Deployment

### When You're Ready to Deploy

For production, don't rely on local Ollama. Options:

1. **Host Ollama on VPS** (~$6-10/month)
   - DigitalOcean, Linode, AWS
   - Your app calls: `http://your-vps:11434/api`

2. **Use Cloud LLM API**
   - HuggingFace Inference API
   - Replicate
   - Azure OpenAI

3. **Render.com + DigitalOcean**
   - Render: Frontend + Backend
   - DigitalOcean: Ollama VPS
   - Connect via env var: `OLLAMA_API=https://your-vps-ip:11434/api`

---

## Next Steps

✅ Setup complete! You now have:
- Local Movie AI chatbot running
- Integration with TMDB for real movie data
- Multi-turn conversation support
- Clean, responsive UI

🚀 From here you can:
1. Test with various prompts
2. Customize the AI systemPrompt in `ollamaService.js`
3. Add conversation history to database (currently in-memory)
4. Deploy frontend + backend to production
5. Set up Ollama on a VPS for production users

---

## Support

### Logs
Check server logs for debugging:
```bash
# Terminal where npm start is running
# Look for: [CHAT], [API], [OLLAMA] tags
```

### Model Alternatives
- **llama3:8b** (Current): Good balance, 7.8GB
- **mistral:7b**: ~80% performance, 5.2GB (faster)
- **neural-chat:7b**: Good for chat, 5.2GB
- **dolphin-mixtral:8x7b**: Most capable, 46GB (!!)

Switch with:
```bash
ollama pull mistral:7b
# Then edit server/src/services/ollamaService.js line 49
# Change: model: 'llama3:8b'  to  model: 'mistral:7b'
```

---

**Built with ❤️ using Ollama + TMDB API**

