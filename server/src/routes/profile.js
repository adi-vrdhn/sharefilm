const express = require("express");
const { User, Friendship, UserMovie } = require("../models");
const { Op } = require("sequelize");

const router = express.Router();

// Get current user's full profile
router.get("/profile/me", async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "name", "email", "bio", "profilePicture"]
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get buddy count
    const buddyCount = await Friendship.count({
      where: { [Op.or]: [{ userId: req.user.id }, { friendId: req.user.id }] }
    });

    return res.json({
      ...user.toJSON(),
      buddyCount: Math.floor(buddyCount / 2) // Each friendship is bidirectional, so divide by 2
    });
  } catch (error) {
    console.error("Profile fetch error:", error.message);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// Get any user's public profile
router.get("/profile/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId, {
      attributes: ["id", "name", "bio", "profilePicture"]
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get buddy count
    const buddyCount = await Friendship.count({
      where: [
        { userId: parseInt(userId) },
        { friendId: parseInt(userId) }
      ]
    });

    // Check if requester is a buddy of this user
    let isBuddy = false;
    if (req.user.id !== parseInt(userId)) {
      const friendship = await Friendship.findOne({
        where: [
          { userId: req.user.id, friendId: parseInt(userId) },
          { userId: parseInt(userId), friendId: req.user.id }
        ]
      });
      isBuddy = !!friendship;
    }

    return res.json({
      ...user.toJSON(),
      buddyCount: Math.floor(buddyCount / 2),
      isBuddy,
      isOwnProfile: req.user.id === parseInt(userId)
    });
  } catch (error) {
    console.error("Public profile fetch error:", error.message);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// Update user's profile
router.put("/profile/me", async (req, res) => {
  try {
    const { bio, profilePicture } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (bio !== undefined) {
      user.bio = bio;
    }
    if (profilePicture !== undefined) {
      user.profilePicture = profilePicture;
    }

    await user.save();

    return res.json({
      id: user.id,
      name: user.name,
      bio: user.bio,
      profilePicture: user.profilePicture
    });
  } catch (error) {
    console.error("Profile update error:", error.message);
    return res.status(500).json({ message: "Failed to update profile" });
  }
});

// Get buddy list with full details
router.get("/profile/me/buddies", async (req, res) => {
  try {
    const friendships = await Friendship.findAll({
      where: { userId: req.user.id },
      attributes: ["friendId"]
    });

    const buddyIds = friendships.map((f) => f.friendId);

    if (buddyIds.length === 0) {
      return res.json([]);
    }

    const buddies = await User.findAll({
      where: { id: buddyIds },
      attributes: ["id", "name", "profilePicture"]
    });

    return res.json(buddies);
  } catch (error) {
    console.error("Buddies list error:", error.message);
    return res.status(500).json({ message: "Failed to fetch buddies" });
  }
});

module.exports = router;
