const express = require("express");
const { User, Friendship, UserMovie } = require("../models");
const { Op } = require("sequelize");

const router = express.Router();

router.get("/getFriends", async (req, res) => {
  try {
    const friendships = await Friendship.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: User,
          as: "friend",
          attributes: ["id", "name", "email", "profilePicture"]
        }
      ]
    });

    const friends = friendships.map((f) => f.friend);
    return res.json(friends);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch buddies" });
  }
});

router.post("/addFriend", async (req, res) => {
  try {
    const { friendName } = req.body;

    if (!friendName) {
      return res.status(400).json({ message: "Friend name required" });
    }

    const friend = await User.findOne({ where: { name: friendName } });
    if (!friend) {
      return res.status(404).json({ message: "User not found" });
    }

    if (friend.id === req.user.id) {
      return res.status(400).json({ message: "Cannot add yourself" });
    }

    const existing = await Friendship.findOne({
      where: {
        userId: req.user.id,
        friendId: friend.id
      }
    });

    if (existing) {
      return res.status(409).json({ message: "Already friends" });
    }

    await Friendship.create({
      userId: req.user.id,
      friendId: friend.id
    });

    await Friendship.create({
      userId: friend.id,
      friendId: req.user.id
    });

    return res.json({ id: friend.id, name: friend.name, email: friend.email });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add friend" });
  }
});

router.delete("/removeFriend/:id", async (req, res) => {
  try {
    const friendship = await Friendship.findOne({
      where: {
        userId: req.user.id,
        friendId: req.params.id
      }
    });

    if (!friendship) {
      return res.status(404).json({ message: "Friendship not found" });
    }

    await friendship.destroy();

    await Friendship.destroy({
      where: {
        userId: req.params.id,
        friendId: req.user.id
      }
    });

    return res.json({ message: "Friend removed" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove friend" });
  }
});

router.get("/discoverUsers", async (req, res) => {
  try {
    const query = req.query.q || "";
    
    const friendIds = await Friendship.findAll({
      where: { userId: req.user.id },
      attributes: ["friendId"]
    });

    const excludeIds = [req.user.id, ...friendIds.map((f) => f.friendId)];

    const users = await User.findAll({
      where: {
        id: { [Op.notIn]: excludeIds },
        name: { [Op.iLike]: `%${query}%` }
      },
      attributes: ["id", "name", "email"],
      limit: 10
    });

    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: "Failed to discover users" });
  }
});

module.exports = router;
