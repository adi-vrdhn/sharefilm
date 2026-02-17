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

    // Get interaction count (movies sent/received) for each friend
    const friendsWithInteractions = await Promise.all(
      friendships.map(async (f) => {
        const sentCount = await UserMovie.count({
          where: {
            senderId: req.user.id,
            receiverId: f.friend.id
          }
        });
        const receivedCount = await UserMovie.count({
          where: {
            senderId: f.friend.id,
            receiverId: req.user.id
          }
        });
        return {
          ...f.friend.toJSON(),
          interactionCount: sentCount + receivedCount
        };
      })
    );

    // Sort by interaction count (most popular first)
    friendsWithInteractions.sort((a, b) => b.interactionCount - a.interactionCount);

    return res.json(friendsWithInteractions);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch buddies" });
  }
});

// Get current user's confirmed friends (public endpoint alternative)
router.get("/confirmed", async (req, res) => {
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

    // Get interaction count (movies sent/received) for each friend
    const friendsWithInteractions = await Promise.all(
      friendships.map(async (f) => {
        const sentCount = await UserMovie.count({
          where: {
            senderId: req.user.id,
            receiverId: f.friend.id
          }
        });
        const receivedCount = await UserMovie.count({
          where: {
            senderId: f.friend.id,
            receiverId: req.user.id
          }
        });
        return {
          ...f.friend.toJSON(),
          interactionCount: sentCount + receivedCount
        };
      })
    );

    // Sort by interaction count (most popular first)
    friendsWithInteractions.sort((a, b) => b.interactionCount - a.interactionCount);

    return res.json(friendsWithInteractions);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch confirmed friends" });
  }
});

// Get confirmed friends for another user (public endpoint)
router.get("/confirmed/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const parsedUserId = parseInt(userId);

    // Check if user exists
    const user = await User.findByPk(parsedUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const friendships = await Friendship.findAll({
      where: { userId: parsedUserId },
      include: [
        {
          model: User,
          as: "friend",
          attributes: ["id", "name", "email", "profilePicture"]
        }
      ]
    });

    // Get interaction count (movies sent/received) for each friend
    const friendsWithInteractions = await Promise.all(
      friendships.map(async (f) => {
        const sentCount = await UserMovie.count({
          where: {
            senderId: parsedUserId,
            receiverId: f.friend.id
          }
        });
        const receivedCount = await UserMovie.count({
          where: {
            senderId: f.friend.id,
            receiverId: parsedUserId
          }
        });
        return {
          ...f.friend.toJSON(),
          interactionCount: sentCount + receivedCount
        };
      })
    );

    // Sort by interaction count (most popular first)
    friendsWithInteractions.sort((a, b) => b.interactionCount - a.interactionCount);

    return res.json(friendsWithInteractions);
  } catch (error) {
    console.error("Public confirmed friends fetch error:", error.message);
    return res.status(500).json({ message: "Failed to fetch confirmed friends" });
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
