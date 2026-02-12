const express = require("express");
const { User, Movie, UserMovie, Notification } = require("../models");
const { searchMovies } = require("../services/tmdb");

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

module.exports = router;
