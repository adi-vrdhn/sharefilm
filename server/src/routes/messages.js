const express = require("express");
const { User, Message, Friendship } = require("../models");
const router = express.Router();

// Get messages with a specific friend
router.get("/getMessages", async (req, res) => {
  try {
    const { with: friendId } = req.query;
    if (!friendId) {
      return res.status(400).json({ message: "Friend ID required" });
    }

    // Check if they are friends
    const friendship = await Friendship.findOne({
      where: {
        user_id: req.user.id,
        friend_id: friendId
      }
    });

    if (!friendship) {
      return res.status(403).json({ message: "Not friends" });
    }

    // Get all messages between these two users
    const messages = await Message.findAll({
      where: {
        [require("sequelize").Op.or]: [
          {
            sender_id: req.user.id,
            receiver_id: friendId
          },
          {
            sender_id: friendId,
            receiver_id: req.user.id
          }
        ]
      },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name"]
        }
      ],
      order: [["created_at", "ASC"]],
      limit: 50
    });

    return res.json(messages);
  } catch (error) {
    console.error("Get messages error:", error.message);
    return res.status(500).json({ message: error.message });
  }
});

// Send a message to a friend
router.post("/sendMessage", async (req, res) => {
  try {
    const { to, content } = req.body;

    if (!to || !content) {
      return res.status(400).json({ message: "To and content required" });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    // Check if they are friends
    const friendship = await Friendship.findOne({
      where: {
        user_id: req.user.id,
        friend_id: to
      }
    });

    if (!friendship) {
      return res.status(403).json({ message: "Not friends" });
    }

    // Create message
    const message = await Message.create({
      sender_id: req.user.id,
      receiver_id: to,
      content: content.trim()
    });

    const populated = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name"]
        }
      ]
    });

    return res.status(201).json(populated);
  } catch (error) {
    console.error("Send message error:", error.message);
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
