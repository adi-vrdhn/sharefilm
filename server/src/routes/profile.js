const express = require("express");
const { User, Friendship, UserMovie } = require("../models");

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
      where: { userId: req.user.id, status: "accepted" }
    });

    return res.json({
      ...user.toJSON(),
      buddyCount
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
      where: { userId: parseInt(userId), status: "accepted" }
    });

    // Check if requester is a buddy of this user
    let isBuddy = false;
    if (req.user.id !== parseInt(userId)) {
      const friendship = await Friendship.findOne({
        where: [
          { userId: req.user.id, friendId: userId, status: "accepted" },
          { userId: userId, friendId: req.user.id, status: "accepted" }
        ]
      });
      isBuddy = !!friendship;
    }

    return res.json({
      ...user.toJSON(),
      buddyCount,
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
      where: { userId: req.user.id, status: "accepted" },
      attributes: ["friendId"]
    });

    const buddyIds = friendships.map((f) => f.friendId);

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
