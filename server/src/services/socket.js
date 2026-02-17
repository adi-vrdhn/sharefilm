// Map to store active user connections
const userSockets = new Map();

// Initialize socket.io connection handlers
const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // When user joins, store their socket id
    socket.on("userLogin", (userId) => {
      userSockets.set(userId, socket.id);
      socket.userId = userId;
      console.log(`User ${userId} logged in with socket ${socket.id}`);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      if (socket.userId) {
        userSockets.delete(socket.userId);
        console.log(`User ${socket.userId} disconnected`);
      }
    });
  });
};

// Send notification to a specific user
const sendNotificationToUser = (io, userId, notification) => {
  const socketId = userSockets.get(userId);
  if (socketId) {
    io.to(socketId).emit("newNotification", notification);
  }
};

// Send notification to multiple users
const sendNotificationToUsers = (io, userIds, notification) => {
  userIds.forEach((userId) => {
    sendNotificationToUser(io, userId, notification);
  });
};

// Check if user is online
const isUserOnline = (userId) => {
  return userSockets.has(userId);
};

module.exports = {
  initializeSocket,
  sendNotificationToUser,
  sendNotificationToUsers,
  isUserOnline,
  userSockets
};
