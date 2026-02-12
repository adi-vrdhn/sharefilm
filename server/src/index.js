require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const sequelize = require("./config/db");
require("./models");

const authRoutes = require("./routes/auth");
const movieRoutes = require("./routes/movies");
const notificationRoutes = require("./routes/notifications");
const friendRoutes = require("./routes/friends");
const messageRoutes = require("./routes/messages");
const authMiddleware = require("./middleware/auth");

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);

// Serve static files from React build BEFORE auth middleware
const buildPath = path.join(__dirname, "../../client/dist");
app.use(express.static(buildPath));

// Apply auth middleware only to API routes
app.use(authMiddleware);
app.use(movieRoutes);
app.use(notificationRoutes);
app.use(friendRoutes);
app.use(messageRoutes);

// SPA fallback: serve index.html for any non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      console.log(`Server running on ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

start();
