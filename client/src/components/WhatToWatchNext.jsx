import React, { useState, useEffect } from "react";
import { Star, Play, TrendingUp } from "lucide-react";
import api from "../api/axios";

const WhatToWatchNext = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/recommendations?limit=5");
      setRecommendations(response.data.data.recommendations);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setError("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-8 p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={24} className="text-blue-600" />
          <h3 className="text-xl font-bold">What to Watch Next</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={24} className="text-red-600" />
          <h3 className="text-xl font-bold text-red-800 dark:text-red-200">
            What to Watch Next
          </h3>
        </div>
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <button
          onClick={fetchRecommendations}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={24} className="text-blue-600 dark:text-blue-400" />
          <h3 className="text-xl font-bold">What to Watch Next</h3>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Personalized for you
        </span>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          <p>No recommendations yet. Start watching movies to get personalized suggestions!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((movie) => (
            <div
              key={movie.id}
              className="flex gap-4 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 hover:shadow-lg dark:hover:shadow-gray-900/50 transition cursor-pointer group"
            >
              {/* Movie Poster */}
              <div className="relative w-16 h-24 flex-shrink-0 rounded overflow-hidden">
                {movie.poster_path ? (
                  <>
                    <img
                      src={`https://image.tmdb.org/t/p/w154${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition flex items-center justify-center">
                      <Play size={16} className="text-white opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                    <Play size={20} className="text-gray-600 dark:text-gray-400" />
                  </div>
                )}
              </div>

              {/* Movie Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 dark:text-white truncate">
                  {movie.title}
                </h4>

                {movie.release_date && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(movie.release_date).getFullYear()}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-2">
                  {movie.vote_average && (
                    <div className="flex items-center gap-1">
                      <Star
                        size={14}
                        className="text-yellow-500 fill-yellow-500"
                      />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {movie.vote_average.toFixed(1)}
                      </span>
                    </div>
                  )}

                  {movie.recommendationScore && (
                    <div className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full font-semibold">
                      {Math.round(movie.recommendationScore)}% match
                    </div>
                  )}
                </div>

                {movie.overview && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                    {movie.overview}
                  </p>
                )}
              </div>

              {/* Score Circle */}
              <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition">
                {Math.round(movie.recommendationScore || 0)}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={fetchRecommendations}
        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
      >
        Refresh Recommendations
      </button>
    </div>
  );
};

export default WhatToWatchNext;
