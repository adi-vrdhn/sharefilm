const User = require("./User");
const Movie = require("./Movie");
const UserMovie = require("./UserMovie");
const Notification = require("./Notification");
const Friendship = require("./Friendship");
const Message = require("./Message");
const Rating = require("./Rating");

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

User.hasMany(Message, { foreignKey: "sender_id", as: "sentMessages" });
User.hasMany(Message, { foreignKey: "receiver_id", as: "receivedMessages" });
Message.belongsTo(User, { foreignKey: "sender_id", as: "sender" });
Message.belongsTo(User, { foreignKey: "receiver_id", as: "receiver" });

User.hasMany(Rating, { foreignKey: "user_id" });
Rating.belongsTo(User, { foreignKey: "user_id" });
UserMovie.hasMany(Rating, { foreignKey: "user_movie_id" });
Rating.belongsTo(UserMovie, { foreignKey: "user_movie_id" });

module.exports = {
  User,
  Movie,
  UserMovie,
  Notification,
  Friendship,
  Message,
  Rating
};
