import React from "react";

const MovieCard = ({ item, onDelete, onWatched }) => {
  return (
    <div className="movie-card">
      {item.movie.poster ? (
        <img src={item.movie.poster} alt={item.movie.title} />
      ) : (
        <div className="poster-placeholder" />
      )}
      <div className="movie-card-body">
        <h3>{item.movie.title}</h3>
        <span className="badge">Added by {item.sender?.name}</span>
        <span className="helper-text">
          {new Date(item.dateAdded).toLocaleDateString()}
        </span>
        <div className="movie-card-actions">
          {onWatched && (
            <button className="primary" onClick={() => onWatched(item)}>
              Watched
            </button>
          )}
          {onDelete && (
            <button className="secondary" onClick={() => onDelete(item.id)}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
