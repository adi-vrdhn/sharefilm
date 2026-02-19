const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User, PasswordReset } = require("../models");
const { recordFailedAttempt, isAccountLocked, clearLoginAttempts } = require("../middleware/accountLockout");
const { logFailedLogin, logSuccessfulLogin, logAccountLockout } = require("../middleware/auditLog");
const { sendPasswordResetEmail } = require("../services/emailService");

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
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // 🔒 Check if account is locked
    const lockStatus = isAccountLocked(email);
    if (lockStatus.locked) {
      logAccountLockout(email, ipAddress);
      return res.status(429).json({
        message: `Account locked due to too many failed attempts. Try again in ${lockStatus.remainingTime} minutes.`,
        lockedUntil: lockStatus.remainingTime
      });
    }

    const user = await User.findOne({ where: { email } });
    
    // Generic error message - don't reveal if email exists
    if (!user) {
      recordFailedAttempt(email);
      logFailedLogin(email, ipAddress, "User not found");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      const attemptResult = recordFailedAttempt(email);
      logFailedLogin(email, ipAddress, "Wrong password");
      
      // If account just got locked
      if (attemptResult.isLocked) {
        logAccountLockout(email, ipAddress);
        return res.status(429).json({
          message: "Too many failed login attempts. Account locked for 15 minutes.",
          lockedUntil: attemptResult.remainingTime
        });
      }
      
      return res.status(401).json({
        message: "Invalid credentials",
        attemptsRemaining: attemptResult.attemptsRemaining
      });
    }

    // ✅ Successful login - clear attempts
    clearLoginAttempts(email);
    logSuccessfulLogin(user.id, email, ipAddress);
    
    const token = generateToken(user);
    return res.json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email, profilePicture: user.profilePicture, bio: user.bio } 
    });
  } catch (error) {
    console.error("[LOGIN] Error:", error.message);
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

/**
 * Forgot Password - Send reset email
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ where: { email } });
    
    // Generic message - don't reveal if email exists for security
    if (!user) {
      return res.json({
        message: "If this email exists in our system, you will receive a password reset link shortly."
      });
    }

    // Generate secure random token (32 bytes)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    // Create password reset record
    await PasswordReset.create({
      userId: user.id,
      token: token,
      expiresAt: expiresAt
    });

    // Send email
    const resetUrl = `${process.env.CLIENT_ORIGIN || "https://yourdomain.com"}/reset-password?token=${token}`;
    const emailResult = await sendPasswordResetEmail(
      user.email,
      user.name,
      token,
      resetUrl
    );

    if (!emailResult.success && process.env.NODE_ENV === "production") {
      console.error("[FORGOT-PASSWORD] Email sending failed:", emailResult.error);
      return res.status(500).json({
        message: "Failed to send reset email. Please try again later."
      });
    }

    return res.json({
      message: "If this email exists in our system, you will receive a password reset link shortly."
    });
  } catch (error) {
    console.error("[FORGOT-PASSWORD] Error:", error.message);
    return res.status(500).json({
      message: "Failed to process password reset request."
    });
  }
});

/**
 * Reset Password - Verify token and update password
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    // 🔒 Password strength validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
      });
    }

    // Find reset request
    const resetRequest = await PasswordReset.findOne({
      where: { token: token }
    });

    if (!resetRequest) {
      return res.status(400).json({
        message: "Invalid or expired password reset link."
      });
    }

    // Check if token is expired
    if (new Date() > resetRequest.expiresAt) {
      // Delete expired token
      await resetRequest.destroy();
      return res.status(400).json({
        message: "Password reset link has expired. Please request a new one."
      });
    }

    // Check if token was already used
    if (resetRequest.usedAt) {
      return res.status(400).json({
        message: "This password reset link has already been used."
      });
    }

    // Get user and update password
    const user = await User.findByPk(resetRequest.userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    // Mark token as used
    await resetRequest.update({ usedAt: new Date() });

    // Clear any failed login attempts for this user
    clearLoginAttempts(user.email);

    return res.json({
      message: "Password has been reset successfully. You can now login with your new password."
    });
  } catch (error) {
    console.error("[RESET-PASSWORD] Error:", error.message);
    return res.status(500).json({
      message: "Failed to reset password."
    });
  }
});

/**
 * Verify Reset Token - Check if token is valid (for frontend)
 */
router.get("/verify-reset-token/:token", async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: "Token is required", valid: false });
    }

    const resetRequest = await PasswordReset.findOne({
      where: { token: token }
    });

    if (!resetRequest) {
      return res.json({
        message: "Invalid password reset link.",
        valid: false
      });
    }

    // Check if token is expired
    if (new Date() > resetRequest.expiresAt) {
      return res.json({
        message: "Password reset link has expired.",
        valid: false
      });
    }

    // Check if already used
    if (resetRequest.usedAt) {
      return res.json({
        message: "This password reset link has already been used.",
        valid: false
      });
    }

    return res.json({
      message: "Valid reset token.",
      valid: true
    });
  } catch (error) {
    console.error("[VERIFY-TOKEN] Error:", error.message);
    return res.status(500).json({
      message: "Error verifying token.",
      valid: false
    });
  }
});

router.post("/logout", (req, res) => {
  return res.json({ message: "Logged out" });
});

module.exports = router;
