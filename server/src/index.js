require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const sequelize = require("./config/db");
require("./models");

const authRoutes = require("./routes/auth");
const movieRoutes = require("./routes/movies");
const notificationRoutes = require("./routes/notifications");
const friendRoutes = require("./routes/friends");
const authMiddleware = require("./middleware/auth");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);

app.use(authMiddleware);
app.use(movieRoutes);
app.use(notificationRoutes);
app.use(friendRoutes);

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
