const express = require("express");
const { User, Message, Friendship } = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/db");
const router = express.Router();

// Get all conversations (list of friends with last message)
router.get("/getConversations", async (req, res) => {
  try {
    // Get all friends
    const friendships = await Friendship.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: User,
          as: "friend",
          attributes: ["id", "name", "username", "profilePicture"]
        }
      ]
    });

    const conversations = await Promise.all(
      friendships.map(async (friendship) => {
        const friend = friendship.friend;
        
        // Get last message with this friend
        const lastMessage = await Message.findOne({
          where: {
            [Op.or]: [
              { sender_id: req.user.id, receiver_id: friend.id },
              { sender_id: friend.id, receiver_id: req.user.id }
            ]
          },
          order: [["created_at", "DESC"]]
        });

        // Count unread messages from this friend
        const unreadCount = await Message.count({
          where: {
            sender_id: friend.id,
            receiver_id: req.user.id,
            read: false
          }
        });

        return {
          friend: {
            id: friend.id,
            name: friend.name,
            username: friend.username,
            profilePicture: friend.profilePicture
          },
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            createdAt: lastMessage.created_at,
            senderId: lastMessage.sender_id
          } : null,
          unreadCount
        };
      })
    );

    // Sort by last message time
    conversations.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });

    return res.json(conversations);
  } catch (error) {
    console.error("Get conversations error:", error.message);
    return res.status(500).json({ message: error.message });
  }
});

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
