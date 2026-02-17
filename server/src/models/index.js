const User = require("./User");
const Movie = require("./Movie");
const UserMovie = require("./UserMovie");
const Notification = require("./Notification");
const Friendship = require("./Friendship");
const Message = require("./Message");
const Rating = require("./Rating");
const SharedParty = require("./SharedParty");
const SwipeEvent = require("./SwipeEvent");
const MovieTasteRating = require("./MovieTasteRating");
const UserTasteVector = require("./UserTasteVector");

User.hasMany(UserMovie, { foreignKey: "receiver_id", as: "receivedMovies", constraints: true });
User.hasMany(UserMovie, { foreignKey: "sender_id", as: "sentMovies", constraints: true });
UserMovie.belongsTo(User, { foreignKey: "receiver_id", as: "receiver", constraints: true });
UserMovie.belongsTo(User, { foreignKey: "sender_id", as: "sender", constraints: true });

Movie.hasMany(UserMovie, { foreignKey: "movie_id", constraints: true });
UserMovie.belongsTo(Movie, { foreignKey: "movie_id", constraints: true });

User.hasMany(Notification, { foreignKey: "user_id", constraints: true });
Notification.belongsTo(User, { foreignKey: "user_id", constraints: true });

User.hasMany(Friendship, { foreignKey: "user_id", as: "friendships", constraints: true });
Friendship.belongsTo(User, { foreignKey: "user_id", as: "user", constraints: true });
Friendship.belongsTo(User, { foreignKey: "friend_id", as: "friend", constraints: true });

User.hasMany(Message, { foreignKey: "sender_id", as: "sentMessages", constraints: true });
User.hasMany(Message, { foreignKey: "receiver_id", as: "receivedMessages", constraints: true });
Message.belongsTo(User, { foreignKey: "sender_id", as: "sender", constraints: true });
Message.belongsTo(User, { foreignKey: "receiver_id", as: "receiver", constraints: true });

User.hasMany(Rating, { foreignKey: "user_id", constraints: true });
Rating.belongsTo(User, { foreignKey: "user_id", constraints: true });
UserMovie.hasMany(Rating, { foreignKey: "user_movie_id", constraints: true });
Rating.belongsTo(UserMovie, { foreignKey: "user_movie_id", constraints: true });

User.hasMany(SwipeEvent, { foreignKey: "user_id", constraints: true });
SwipeEvent.belongsTo(User, { foreignKey: "user_id", constraints: true });

User.hasMany(MovieTasteRating, { foreignKey: "user_id", constraints: true });
MovieTasteRating.belongsTo(User, { foreignKey: "user_id", constraints: true });

User.hasMany(UserTasteVector, { foreignKey: "user_id", constraints: true });
UserTasteVector.belongsTo(User, { foreignKey: "user_id", constraints: true });

module.exports = {
  User,
  Movie,
  UserMovie,
  Notification,
  Friendship,
  Message,
  Rating,
  SharedParty,
  SwipeEvent,
  MovieTasteRating,
  UserTasteVector
};
