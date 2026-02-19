import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './movieAI.css';

const MovieAI = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your Movie AI assistant. Tell me what kind of movie you want to watch, and I\'ll find the perfect recommendations for you. For example: "I am bored. I have an exam tomorrow. I want a romantic movie set in New York"',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check Ollama status on mount
  useEffect(() => {
    checkOllamaStatus();
  }, []);

  const checkOllamaStatus = async () => {
    try {
      const response = await axios.get('/api/movie-ai/verify');
      setOllamaStatus(response.data);
    } catch (error) {
      setOllamaStatus({
        connected: false,
        error: 'Failed to connect to Ollama. Make sure it\'s running locally.',
      });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    if (!ollamaStatus?.connected) {
      alert('Ollama is not running. Please start it with: ollama serve');
      return;
    }

    // Add user message to UI immediately
    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(
        '/api/movie-ai/chat',
        {
          message: input,
          conversationId: conversationId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      // Update conversation ID
      if (response.data.conversationId) {
        setConversationId(response.data.conversationId);
      }

      // Add AI response with movies
      const assistantMessage = {
        role: 'assistant',
        content: response.data.aiResponse,
        movies: response.data.movies,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      let errorMessage = 'Failed to get recommendation. ';
      if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.message === 'Network Error') {
        errorMessage += 'Ollama is not running. Start it with: ollama serve';
      }

      const errorMsg = {
        role: 'assistant',
        content: errorMessage,
        isError: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearHistory = () => {
    if (
      window.confirm(
        'Clear conversation history? This cannot be undone.'
      )
    ) {
      setMessages([
        {
          role: 'assistant',
          content: 'Hello! I\'m your Movie AI assistant. Tell me what kind of movie you want to watch.',
          timestamp: new Date(),
        },
      ]);
      setConversationId(null);
      setInput('');
    }
  };

  return (
    <div className="movie-ai-container">
      <div className="movie-ai-header">
        <h1>🎬 Movie AI</h1>
        <p>Ask for movie recommendations naturally</p>

        {!ollamaStatus?.connected && (
          <div className="ollama-warning">
            ⚠️ Ollama is not running. Start it with:{' '}
            <code>ollama serve</code>
          </div>
        )}

        {ollamaStatus?.connected && (
          <div className="ollama-status">
            ✅ {ollamaStatus.model || 'Ollama'} ready
          </div>
        )}
      </div>

      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`message message-${msg.role}`}>
            <div className="message-header">
              <span className="role-badge">{msg.role === 'user' ? 'You' : '🤖 AI'}</span>
              <span className="timestamp">
                {msg.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div
              className={`message-content ${
                msg.isError ? 'error-message' : ''
              }`}
            >
              {msg.content}
            </div>

            {msg.movies && msg.movies.length > 0 && (
              <div className="movies-grid">
                {msg.movies.map((movie) => (
                  <div key={movie.id} className="movie-card">
                    {movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                        alt={movie.title}
                        className="movie-poster"
                      />
                    ) : (
                      <div className="movie-poster-placeholder">
                        🎬 No Image
                      </div>
                    )}

                    <div className="movie-info">
                      <h4>{movie.title}</h4>

                      {movie.release_year && (
                        <p className="year">({movie.release_year})</p>
                      )}

                      <div className="rating">
                        <span className="stars">⭐ {movie.rating.toFixed(1)}</span>
                      </div>

                      {movie.synopsis && (
                        <p className="synopsis">{movie.synopsis.slice(0, 100)}...</p>
                      )}

                      <a
                        href={`https://www.themoviedb.org/movie/${movie.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tmdb-link"
                      >
                        View Details →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="message message-assistant">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p style={{ marginTop: '10px', color: '#666' }}>
              AI is thinking...
            </p>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="input-area">
        <form onSubmit={handleSendMessage} className="input-form">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., 'A romantic comedy set in Paris'..."
            disabled={loading || !ollamaStatus?.connected}
            className="chat-input"
            maxLength={500}
          />

          <button
            type="submit"
            disabled={loading || !input.trim() || !ollamaStatus?.connected}
            className="send-button"
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </form>

        <div className="input-footer">
          <p className="tip">
            💡 Tip: Be descriptive! "I want a movie similar to Inception but
            more romantic" works better than "good movie"
          </p>

          <button onClick={clearHistory} className="clear-button">
            🗑️ Clear History
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieAI;
