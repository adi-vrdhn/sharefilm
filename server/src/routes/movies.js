const express = require("express");
const { User, Movie, UserMovie, Notification, Rating, SwipeEvent } = require("../models");
const {
  searchMovies,
  getPopularMovies,
  getMovieDetails,
  getGenres,
  getWatchProviders,
  discoverMovies
} = require("../services/tmdb");

const router = express.Router();

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
    const results = await discoverMovies({
      genre: req.query.genre,
      provider: req.query.provider,
      language: req.query.language,
      page: Number(req.query.page || 1),
      region: req.query.region || "IN"
    });
    return res.json(results);
  } catch (error) {
    console.error("TMDB discover error:", error.message);
    return res.status(500).json({ message: error.message || "Failed to discover movies" });
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
    const { movie, friend } = req.body;

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
