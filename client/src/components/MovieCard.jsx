import React from "react";

const MovieCard = ({ item, onDelete }) => {
  return (
    <div className="movie-card">
      {item.movie.poster ? (
        <img src={item.movie.poster} alt={item.movie.title} />
      ) : (
        <div style={{ height: 320, background: "#f4e3d6" }} />
      )}
      <div className="movie-card-body">
        <h3>{item.movie.title}</h3>
        <span className="badge">Added by {item.sender?.name}</span>
        <span className="helper-text">
          {new Date(item.dateAdded).toLocaleDateString()}
        </span>
        {onDelete && (
          <button className="secondary" onClick={() => onDelete(item.id)}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default MovieCard;
