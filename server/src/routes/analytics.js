const express = require("express");
const { User, Movie, UserMovie, SwipeEvent, Friendship } = require("../models");
const { Op } = require("sequelize");

const router = express.Router();

// Admin emails - only these users can access analytics
const ADMIN_EMAILS = ["avrdhn28@gmail.com"];

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  const userEmail = req.user?.email;
  
  if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
    return res.status(403).json({ 
      message: "Access denied. Admin privileges required.",
      isAdmin: false 
    });
  }
  
  next();
};

// Get overall app statistics
router.get("/stats", isAdmin, async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.count();

    // Users registered today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const usersToday = await User.count({
      where: {
        createdAt: {
          [Op.gte]: today
        }
      }
    });

    // Users registered this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const usersThisWeek = await User.count({
      where: {
        createdAt: {
          [Op.gte]: weekAgo
        }
      }
    });

    // Total movies shared
    const totalMoviesShared = await UserMovie.count();

    // Total swipe events (interactions)
    const totalInteractions = await SwipeEvent.count();

    // Total friendships
    const totalFriendships = await Friendship.count() / 2; // Divide by 2 since friendships are bidirectional

    // Recent users (last 10)
    const recentUsers = await User.findAll({
      attributes: ["id", "name", "email", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit: 10
    });

    // Most active users
    const activeUsers = await SwipeEvent.findAll({
      attributes: [
        "userId",
        [require("sequelize").fn("COUNT", require("sequelize").col("id")), "activityCount"]
      ],
      group: ["userId"],
      order: [[require("sequelize").fn("COUNT", require("sequelize").col("id")), "DESC"]],
      limit: 5,
      include: [
        {
          model: User,
          attributes: ["id", "name"]
        }
      ]
    });

    return res.json({
      overview: {
        totalUsers,
        usersToday,
        usersThisWeek,
        totalMoviesShared,
        totalInteractions,
        totalFriendships
      },
      recentUsers,
      activeUsers
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

// Get all users list
router.get("/users", isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "createdAt"],
      order: [["createdAt", "DESC"]]
    });

    return res.json({ users, total: users.length });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
});

module.exports = router;
