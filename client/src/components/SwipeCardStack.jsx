import React, { useState, useRef, useEffect } from "react";
import { useSpring, animated, config } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { Heart, X, Info, Plus, ChevronDown } from "lucide-react";
import "../styles/swipeCardStack.css";

const SwipeCardStack = ({
  movies,
  currentIndex,
  onSwipeRight,
  onSwipeLeft,
  onSwipeDown,
  onLongPress,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const longPressTimer = useRef(null);
  const containerRef = useRef(null);

  const movie = movies[currentIndex];

  // Spring animation for main card
  const [{ x, y, rotate, opacity }, springApi] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    opacity: 1,
    config: config.molasses,
  }));

  // Spring animation for next card (subtle peek)
  const nextMovie = movies[currentIndex + 1];
  const [{ scale: nextScale }, nextSpringApi] = useSpring(() => ({
    scale: 0.95,
    config: config.slow,
  }));

  // Gesture handler for dragging
  const bind = useDrag(
    ({ offset: [ox, oy], velocity, direction: [dx, dy], last }) => {
      if (expanded) return;

      // Check gesture type
      if (last) {
        let triggeredAction = false;

        // Right swipe (watched)
        if (ox > 100 && dx > 0) {
          onSwipeRight();
          triggeredAction = true;
        }
        // Left swipe (passed)
        else if (ox < -100 && dx < 0) {
          onSwipeLeft();
          triggeredAction = true;
        }
        // Down swipe (expand/find similar)
        else if (oy > 80 && dy > 0) {
          setExpanded(true);
          onSwipeDown();
          triggeredAction = true;
        }

        if (triggeredAction) {
          // Reset animation
          springApi.start({
            x: 0,
            y: 0,
            rotate: 0,
            opacity: 1,
            config: config.molasses,
          });
          setShowDetails(false);
        } else {
          // Snap back
          springApi.start({
            x: 0,
            y: 0,
            rotate: 0,
            opacity: 1,
            config: config.molasses,
          });
        }
      } else {
        // Update animation while dragging
        springApi.start({
          x: ox,
          y: oy,
          rotate: (ox / containerRef.current?.offsetWidth) * 20 || 0,
          opacity: 1 - Math.abs(ox) / (containerRef.current?.offsetWidth || 1) * 0.2,
          immediate: true,
          config: config.stiff,
        });

        // Show details on downward drag
        if (oy > 30) {
          setShowDetails(true);
        } else {
          setShowDetails(false);
        }
      }
    }
  );

  // Handle long press for watchlist
  const handleMouseDown = () => {
    longPressTimer.current = setTimeout(() => {
      onLongPress();
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  if (!movie) {
    return (
      <div className="card-container">
        <div className="empty-message">No more movies to show</div>
      </div>
    );
  }

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://via.placeholder.com/300x400?text=No+Poster";

  return (
    <div
      className="card-container"
      ref={containerRef}
      {...bind()}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    >
      {/* Next card peek (subtle) */}
      {nextMovie && (
        <animated.div
          className="card card-next"
          style={{
            scale: nextScale,
          }}
        >
          <div
            className="card-poster"
            style={{
              backgroundImage: `url(${
                nextMovie.poster_path
                  ? `https://image.tmdb.org/t/p/w500${nextMovie.poster_path}`
                  : "https://via.placeholder.com/300x400?text=No+Poster"
              })`,
            }}
          />
        </animated.div>
      )}

      {/* Main card */}
      <animated.div
        className={`card card-active ${expanded ? "expanded" : ""}`}
        style={{
          x,
          y,
          rotate,
          opacity,
        }}
      >
        {/* Poster Background */}
        <div
          className="card-poster"
          style={{
            backgroundImage: `url(${posterUrl})`,
            filter: showDetails ? "blur(8px)" : "blur(0px)",
          }}
        />

        {/* Overlay Gradient */}
        <div className="card-overlay" />

        {/* Close Button */}
        <button className="card-close-btn" aria-label="Close">
          <X size={24} />
        </button>

        {/* Card Content - Always Visible */}
        <div className="card-content">
          <div className="card-info">
            <h2 className="card-title">{movie.title}</h2>
            <div className="card-meta">
              <span className="year">
                {movie.release_date ? movie.release_date.split("-")[0] : "N/A"}
              </span>
              {movie.original_language && (
                <span className="language-badge">{movie.original_language.toUpperCase()}</span>
              )}
              {movie.platform && (
                <span className="platform-badge">{movie.platform}</span>
              )}
            </div>
            {movie.friends_watched && (
              <div className="friends-watched">
                👥 Watched by {movie.friends_watched} friend{movie.friends_watched > 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Action Buttons (visible when dragging down) */}
          {showDetails && (
            <div className="quick-actions">
              <button className="action-btn info-btn" title="Find Similar">
                <Info size={20} />
              </button>
              <button className="action-btn add-btn" title="Add to Watchlist">
                <Plus size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Expanded Details (show on expand) */}
        {expanded && (
          <div className="card-details">
            {movie.overview && (
              <div className="details-section">
                <h3>Overview</h3>
                <p>{movie.overview}</p>
              </div>
            )}

            {movie.cast && movie.cast.length > 0 && (
              <div className="details-section">
                <h3>Cast</h3>
                <div className="cast-list">
                  {movie.cast.slice(0, 5).map((actor, idx) => (
                    <span key={idx} className="cast-member">
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {movie.director && (
              <div className="details-section">
                <h3>Director</h3>
                <p>{movie.director}</p>
              </div>
            )}

            {movie.vote_average && (
              <div className="details-section">
                <h3>Rating</h3>
                <div className="rating">
                  <span className="rating-value">{movie.vote_average.toFixed(1)}</span>
                  <span className="rating-stars">
                    {"⭐".repeat(Math.round(movie.vote_average / 2))}
                  </span>
                </div>
              </div>
            )}

            <button
              className="collapse-btn"
              onClick={() => setExpanded(false)}
            >
              <ChevronDown size={20} /> Collapse
            </button>
          </div>
        )}

        {/* Swipe Instructions */}
        <div className="swipe-hints">
          <div className="hint left">
            <X size={20} /> Pass
          </div>
          <div className="hint center">
            <ChevronDown size={20} /> Similar
          </div>
          <div className="hint right">
            <Heart size={20} /> Watched
          </div>
        </div>
      </animated.div>
    </div>
  );
};

export default SwipeCardStack;
