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

module.exports = router;
