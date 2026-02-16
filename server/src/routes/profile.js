const express = require("express");
const bcrypt = require("bcryptjs");
const { User, Friendship, UserMovie, Movie } = require("../models");
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
    const parsedUserId = parseInt(userId);
    
    const user = await User.findByPk(parsedUserId, {
      attributes: ["id", "name", "bio", "profilePicture"]
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get buddy count using proper OR condition
    const buddyCount = await Friendship.count({
      where: {
        [Op.or]: [
          { userId: parsedUserId },
          { friendId: parsedUserId }
        ]
      }
    });

    // Check if requester is a buddy of this user
    let isBuddy = false;
    if (req.user.id !== parsedUserId) {
      const friendship = await Friendship.findOne({
        where: {
          [Op.or]: [
            { userId: req.user.id, friendId: parsedUserId },
            { userId: parsedUserId, friendId: req.user.id }
          ]
        }
      });
      isBuddy = !!friendship;
    }

    return res.json({
      ...user.toJSON(),
      buddyCount: Math.floor(buddyCount / 2),
      isBuddy,
      isOwnProfile: req.user.id === parsedUserId
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
    // Get all friendships where current user is either userId or friendId
    const friendships = await Friendship.findAll({
      where: { [Op.or]: [{ userId: req.user.id }, { friendId: req.user.id }] },
      attributes: ["userId", "friendId"]
    });

    // Extract unique buddy IDs (the other user in each friendship)
    const buddyIds = friendships.map((f) => 
      f.userId === req.user.id ? f.friendId : f.userId
    );

    if (buddyIds.length === 0) {
      return res.json([]);
    }

    const buddies = await User.findAll({
      where: { id: buddyIds },
      attributes: ["id", "name", "profilePicture", "bio"]
    });

    return res.json(buddies);
  } catch (error) {
    console.error("Buddies list error:", error.message);
    return res.status(500).json({ message: "Failed to fetch buddies" });
  }
});

// Change password
router.put("/profile/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both passwords required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash and save new password
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Password change error:", error.message);
    return res.status(500).json({ message: "Failed to change password" });
  }
});

// Change username
router.put("/profile/change-username", async (req, res) => {
  try {
    const { newUsername } = req.body;

    if (!newUsername) {
      return res.status(400).json({ message: "New username required" });
    }

    if (newUsername.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ where: { name: newUsername } });
    if (existingUser) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = newUsername;
    await user.save();

    return res.json({ 
      message: "Username changed successfully",
      newUsername: user.name 
    });
  } catch (error) {
    console.error("Username change error:", error.message);
    return res.status(500).json({ message: "Failed to change username" });
  }
});

// Get movies recommended to a user (they are receivers)
router.get("/profile/user/:userId/movies-to", async (req, res) => {
  try {
    const { userId } = req.params;
    const parsedUserId = parseInt(userId);

    const movies = await UserMovie.findAll({
      where: { receiverId: parsedUserId },
      include: [
        {
          model: Movie,
          attributes: ["id", "title", "poster", "year"],
          required: true
        },
        {
          model: User,
          as: "sender",
          attributes: ["id", "name", "profilePicture"],
          required: true
        }
      ],
      order: [["dateAdded", "DESC"]],
      attributes: ["id", "dateAdded"]
    });

    return res.json(movies);
  } catch (error) {
    console.error("Movies-to fetch error:", error.message);
    return res.status(500).json({ message: "Failed to fetch movies" });
  }
});

// Get movies recommended by a user (they are senders)
router.get("/profile/user/:userId/movies-from", async (req, res) => {
  try {
    const { userId } = req.params;
    const parsedUserId = parseInt(userId);

    const movies = await UserMovie.findAll({
      where: { senderId: parsedUserId },
      include: [
        {
          model: Movie,
          attributes: ["id", "title", "poster", "year"],
          required: true
        },
        {
          model: User,
          as: "receiver",
          attributes: ["id", "name", "profilePicture"],
          required: true
        }
      ],
      order: [["dateAdded", "DESC"]],
      attributes: ["id", "dateAdded"]
    });

    return res.json(movies);
  } catch (error) {
    console.error("Movies-from fetch error:", error.message);
    return res.status(500).json({ message: "Failed to fetch movies" });
  }
});

module.exports = router;
