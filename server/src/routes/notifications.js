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

router.delete("/clearNotifications", async (req, res) => {
  try {
    const result = await Notification.destroy({
      where: { userId: req.user.id }
    });

    return res.json({ 
      message: "Notifications cleared", 
      deletedCount: result 
    });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    return res.status(500).json({ message: "Failed to clear notifications" });
  }
});

router.delete("/notification/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByPk(id);
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this notification" });
    }

    await notification.destroy();

    return res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({ message: "Failed to delete notification" });
  }
});

module.exports = router;
