const User = require("./User");
const Movie = require("./Movie");
const UserMovie = require("./UserMovie");
const Notification = require("./Notification");
const Friendship = require("./Friendship");

User.hasMany(UserMovie, { foreignKey: "receiver_id", as: "receivedMovies" });
User.hasMany(UserMovie, { foreignKey: "sender_id", as: "sentMovies" });
UserMovie.belongsTo(User, { foreignKey: "receiver_id", as: "receiver" });
UserMovie.belongsTo(User, { foreignKey: "sender_id", as: "sender" });

Movie.hasMany(UserMovie, { foreignKey: "movie_id" });
UserMovie.belongsTo(Movie, { foreignKey: "movie_id" });

User.hasMany(Notification, { foreignKey: "user_id" });
Notification.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Friendship, { foreignKey: "user_id", as: "friendships" });
Friendship.belongsTo(User, { foreignKey: "user_id", as: "user" });
Friendship.belongsTo(User, { foreignKey: "friend_id", as: "friend" });

module.exports = {
  User,
  Movie,
  UserMovie,
  Notification,
  Friendship
};
