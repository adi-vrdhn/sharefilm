const User = require("./User");
const Movie = require("./Movie");
const UserMovie = require("./UserMovie");
const Notification = require("./Notification");
const Friendship = require("./Friendship");
const Message = require("./Message");
const Rating = require("./Rating");
const Party = require("./Party");
const PartyMember = require("./PartyMember");
const PartyMovie = require("./PartyMovie");
const PartyVote = require("./PartyVote");

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

User.hasMany(Party, { foreignKey: "createdBy", as: "createdParties" });
Party.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

Party.hasMany(PartyMember, { foreignKey: "partyId", as: "members" });
PartyMember.belongsTo(Party, { foreignKey: "partyId" });
PartyMember.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(PartyMember, { foreignKey: "userId", as: "partyMemberships" });

Party.hasMany(PartyMovie, { foreignKey: "partyId", as: "partyMovies" });
PartyMovie.belongsTo(Party, { foreignKey: "partyId" });
PartyMovie.belongsTo(Movie, { foreignKey: "movieId", as: "movie" });
Movie.hasMany(PartyMovie, { foreignKey: "movieId" });

Party.hasMany(PartyVote, { foreignKey: "partyId", as: "votes" });
PartyVote.belongsTo(Party, { foreignKey: "partyId" });
PartyVote.belongsTo(User, { foreignKey: "userId", as: "voter" });
PartyVote.belongsTo(Movie, { foreignKey: "movieId", as: "movie" });
User.hasMany(PartyVote, { foreignKey: "userId", as: "partyVotes" });
Movie.hasMany(PartyVote, { foreignKey: "movieId" });

module.exports = {
  User,
  Movie,
  UserMovie,
  Notification,
  Friendship,
  Message,
  Rating,
  Party,
  PartyMember,
  PartyMovie,
  PartyVote
};
