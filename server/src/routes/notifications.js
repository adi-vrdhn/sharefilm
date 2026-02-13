const express = require("express");
const { Notification } = require("../models");

const router = express.Router();

router.get("/getNotifications", async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [["id", "DESC"]]
    });

    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ message: "Fetch notifications failed" });
  }
});

router.post("/addNotification", async (req, res) => {
  try {
    const { userId, message, type } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ message: "User ID and message required" });
    }

    const notification = await Notification.create({
      userId: userId,
      text: message,
      read: false
    });

    return res.json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    return res.status(500).json({ message: "Failed to create notification" });
  }
});

module.exports = router;
