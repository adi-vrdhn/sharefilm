const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" } // Changed from 7d to 1d for better security
  );
};
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 🔒 Password strength validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character" 
      });
    }

    // Input validation
    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ message: "Name must be 2-50 characters" });
    }

    const existing = await User.findOne({
      where: {
        email
      }
    });

    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const existingName = await User.findOne({ where: { name } });
    if (existingName) {
      return res.status(409).json({ message: "Username already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    const token = generateToken(user);
    return res.json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email, profilePicture: user.profilePicture, bio: user.bio } 
    });
  } catch (error) {
    console.error("[SIGNUP] Error:", error.message);
    return res.status(500).json({ message: "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);
    return res.json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email, profilePicture: user.profilePicture, bio: user.bio } 
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed" });
  }
});

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.id, {
      attributes: ["id", "name", "email", "profilePicture", "bio"]
    });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.json(user);
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

router.post("/logout", (req, res) => {
  return res.json({ message: "Logged out" });
});

module.exports = router;
