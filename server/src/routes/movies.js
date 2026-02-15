const express = require("express");
const { User, Movie, UserMovie, Notification, Rating, SwipeEvent } = require("../models");
const {
  searchMovies,
  getPopularMovies,
  getMovieDetails,
  getGenres,
  getWatchProviders,
  discoverMovies,
  getSimilarMovies
} = require("../services/tmdb");

const router = express.Router();

const getPersonalizedDefaults = async (userId) => {
  const events = await SwipeEvent.findAll({
    where: { userId, action: "want" },
    order: [["createdAt", "DESC"]],
    limit: 200
  });

  const genreCounts = {};
  const providerCounts = {};
  const languageCounts = {};

  events.forEach((event) => {
    (event.genreIds || []).forEach((id) => {
      genreCounts[id] = (genreCounts[id] || 0) + 1;
    });

    if (event.providerId) {
      providerCounts[event.providerId] = (providerCounts[event.providerId] || 0) + 1;
    }

    if (event.language) {
      languageCounts[event.language] = (languageCounts[event.language] || 0) + 1;
    }
  });

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([id]) => id);

  const topProvider = Object.entries(providerCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  const topLanguage = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    topGenres,
    topProvider,
    topLanguage
  };
};

const getWatchedMoviesForRecommendations = async (userId) => {
  const watchedEvents = await SwipeEvent.findAll({
    where: { userId, action: "watched" },
    order: [["createdAt", "DESC"]],
    limit: 10 // Get last 10 watched movies
  });

  return watchedEvents.map(event => event.tmdbId);
};

router.get("/searchMovie", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    const results = await searchMovies(query);
    return res.json(results);
  } catch (error) {
    console.error("TMDB search error:", error.message);
    return res.status(500).json({ message: error.message || "Search failed" });
  }
});

router.get("/popularMovies", async (req, res) => {
  try {
    const results = await getPopularMovies();
    return res.json(results);
  } catch (error) {
    console.error("TMDB popular error:", error.message);
    return res.status(500).json({ message: error.message || "Failed to fetch popular movies" });
  }
});

router.get("/movieDetails/:tmdbId", async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const details = await getMovieDetails(tmdbId);
    return res.json(details);
  } catch (error) {
    console.error("TMDB details error:", error.message);
    return res.status(500).json({ message: error.message || "Failed to fetch movie details" });
  }
});

router.get("/genres", async (req, res) => {
  try {
    const genres = await getGenres();
    return res.json(genres);
  } catch (error) {
    console.error("TMDB genres error:", error.message);
    return res.status(500).json({ message: error.message || "Failed to fetch genres" });
  }
});

router.get("/watchProviders", async (req, res) => {
  try {
    const region = req.query.region || "IN";
    const providers = await getWatchProviders(region);
    return res.json(providers);
  } catch (error) {
    console.error("TMDB providers error:", error.message);
    return res.status(500).json({ message: error.message || "Failed to fetch providers" });
  }
});

router.get("/discoverMovies", async (req, res) => {
  try {
    const genreQuery = req.query.genre;
    const providerQuery = req.query.provider;
    const languageQuery = req.query.language;
    const page = Number(req.query.page || 1);

    let fallback = {};
    if (!genreQuery || !providerQuery || !languageQuery) {
      fallback = await getPersonalizedDefaults(req.user.id);
    }

    const genreValue = genreQuery
      ? genreQuery.split(",").filter(Boolean)
      : fallback.topGenres;

    // Get standard discover results
    const results = await discoverMovies({
      genre: genreValue,
      provider: providerQuery || fallback.topProvider,
      language: languageQuery || fallback.topLanguage,
      page: page,
      region: req.query.region || "IN"
    });

    // On first page, enhance with recommendations based on watched movies
    if (page === 1) {
      const watchedMovieIds = await getWatchedMoviesForRecommendations(req.user.id);
      
      if (watchedMovieIds.length > 0) {
        // Get similar movies to the most recently watched ones
        const similarMoviesPromises = watchedMovieIds.slice(0, 3).map(movieId => 
          getSimilarMovies(movieId).catch(() => [])
        );
        
        const similarMoviesArrays = await Promise.all(similarMoviesPromises);
        const allSimilarMovies = similarMoviesArrays.flat();
        
        // Remove duplicates and movies already in results
        const existingIds = new Set(results.map(m => m.tmdb_id));
        const uniqueSimilar = allSimilarMovies.filter(m => !existingIds.has(m.tmdb_id));
        
        // Mix similar movies into results (30% similar, 70% discover)
        const similarCount = Math.min(6, uniqueSimilar.length);
        const recommendedMovies = uniqueSimilar.slice(0, similarCount);
        
        // Shuffle results with recommendations
        const mixed = [...recommendedMovies, ...results.slice(0, 14)];
        // Shuffle to mix them well
        for (let i = mixed.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [mixed[i], mixed[j]] = [mixed[j], mixed[i]];
        }
        
        return res.json(mixed);
      }
    }

    return res.json(results);
  } catch (error) {
    console.error("TMDB discover error:", error.message);
    return res.status(500).json({ message: error.message || "Failed to discover movies" });
  }
});

router.get("/similarMovies", async (req, res) => {
  try {
    const query = req.query.query;
    const movieId = req.query.movieId;

    let tmdbId = movieId;

    // If no movieId provided, search for the movie using query
    if (!tmdbId && query) {
      const searchResults = await searchMovies(query);
      if (!searchResults || searchResults.length === 0) {
        return res.status(404).json({ message: "Movie not found" });
      }
      tmdbId = searchResults[0].tmdb_id;
    } else if (!tmdbId && !query) {
      return res.status(400).json({ message: "Either query or movieId is required" });
    }

    // Fetch similar movies
    const similarMovies = await getSimilarMovies(tmdbId);
    return res.json(similarMovies);
  } catch (error) {
    console.error("Similar movies error:", error.message);
    return res.status(500).json({ message: error.message || "Failed to fetch similar movies" });
  }
});

router.post("/swipeEvent", async (req, res) => {
  try {
    const { tmdbId, action, genreIds, providerId, language } = req.body;

    if (!tmdbId || !action) {
      return res.status(400).json({ message: "tmdbId and action required" });
    }

    if (!["nah", "watched", "want"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const event = await SwipeEvent.create({
      userId: req.user.id,
      tmdbId,
      action,
      genreIds: Array.isArray(genreIds) ? genreIds : null,
      providerId: providerId || null,
      language: language || null
    });

    return res.json({ id: event.id });
  } catch (error) {
    console.error("Swipe event error:", error.message);
    return res.status(500).json({ message: "Failed to record swipe" });
  }
});

router.post("/addMovieForFriend", async (req, res) => {
  try {
    const { movie, friend, force } = req.body;

    if (!movie || !friend) {
      return res.status(400).json({ message: "Movie and friend required" });
    }

    const friendUser = await User.findOne({
      where: {
        name: friend
      }
    });

    if (!friendUser) {
      return res.status(404).json({ message: "Friend not found" });
    }

    if (friendUser.id === req.user.id) {
      return res.status(400).json({ message: "Cannot add to yourself" });
    }

    // Check if friend has already watched this movie (unless force = true)
    if (!force) {
      const watchedEvent = await SwipeEvent.findOne({
        where: {
          userId: friendUser.id,
          tmdbId: movie.tmdb_id,
          action: "watched"
        }
      });

      if (watchedEvent) {
        return res.status(409).json({ 
          message: "already_watched",
          warning: `${friendUser.name} has already watched ${movie.title} through Discover.`,
          movieTitle: movie.title,
          friendName: friendUser.name
        });
      }
    }

    const [savedMovie] = await Movie.findOrCreate({
      where: { tmdbId: movie.tmdb_id },
      defaults: {
        title: movie.title,
        poster: movie.poster,
        year: movie.year
      }
    });

    const userMovie = await UserMovie.create({
      receiverId: friendUser.id,
      senderId: req.user.id,
      movieId: savedMovie.id
    });

    await Notification.create({
      userId: friendUser.id,
      text: `${req.user.name} added ${savedMovie.title} for you.`
    });

    return res.json({ id: userMovie.id });
  } catch (error) {
    return res.status(500).json({ message: "Add movie failed" });
  }
});

router.get("/getUserList", async (req, res) => {
  try {
    const list = await UserMovie.findAll({
      where: { receiverId: req.user.id },
      include: [
        { model: Movie },
        { model: User, as: "sender", attributes: ["id", "name"] }
      ],
      order: [["dateAdded", "DESC"]]
    });

    const mapped = list.map((item) => ({
      id: item.id,
      dateAdded: item.dateAdded,
      receiverId: item.receiverId,
      sender: item.sender,
      movie: item.Movie
    }));

    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ message: "Fetch list failed" });
  }
});

router.delete("/deleteMovie/:id", async (req, res) => {
  try {
    const record = await UserMovie.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Movie entry not found" });
    }

    if (record.receiverId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await record.destroy();
    return res.json({ message: "Deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Delete failed" });
  }
});

// Rate a movie
router.post("/rateMovie", async (req, res) => {
  try {
    const { userMovieId, rating } = req.body;

    if (!userMovieId || !rating) {
      return res.status(400).json({ message: "userMovieId and rating required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Check if user is the receiver of this movie
    const userMovie = await UserMovie.findByPk(userMovieId);
    if (!userMovie || userMovie.receiverId !== req.user.id) {
      return res.status(403).json({ message: "Cannot rate this movie" });
    }

    // Find or create rating
    const [ratingRecord] = await Rating.findOrCreate({
      where: { user_id: req.user.id, user_movie_id: userMovieId },
      defaults: { rating }
    });

    if (ratingRecord.rating !== rating) {
      ratingRecord.rating = rating;
      await ratingRecord.save();
    }

    return res.json(ratingRecord);
  } catch (error) {
    console.error("Rate movie error:", error.message);
    return res.status(500).json({ message: error.message });
  }
});

// Get ratings for a movie
router.get("/getMovieRatings/:userMovieId", async (req, res) => {
  try {
    const { userMovieId } = req.params;

    const ratings = await Rating.findAll({
      where: { user_movie_id: userMovieId },
      include: [
        {
          model: User,
          attributes: ["id", "name"]
        }
      ]
    });

    return res.json(ratings);
  } catch (error) {
    console.error("Get ratings error:", error.message);
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
