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

User.hasMany(Party, { foreignKey: "createdBy", as: "createdParties", constraints: true });
Party.belongsTo(User, { foreignKey: "createdBy", as: "creator", constraints: true });

Party.hasMany(PartyMember, { foreignKey: "partyId", as: "members", constraints: true });
PartyMember.belongsTo(Party, { foreignKey: "partyId", constraints: true });
PartyMember.belongsTo(User, { foreignKey: "userId", as: "user", constraints: true });
User.hasMany(PartyMember, { foreignKey: "userId", as: "partyMemberships", constraints: true });

Party.hasMany(PartyMovie, { foreignKey: "partyId", as: "partyMovies", constraints: true });
PartyMovie.belongsTo(Party, { foreignKey: "partyId", constraints: true });
PartyMovie.belongsTo(Movie, { foreignKey: "movieId", as: "movie", constraints: true });
Movie.hasMany(PartyMovie, { foreignKey: "movieId", constraints: true });

Party.hasMany(PartyVote, { foreignKey: "partyId", as: "votes", constraints: true });
PartyVote.belongsTo(Party, { foreignKey: "partyId", constraints: true });
PartyVote.belongsTo(User, { foreignKey: "userId", as: "voter", constraints: true });
PartyVote.belongsTo(Movie, { foreignKey: "movieId", as: "movie", constraints: true });
User.hasMany(PartyVote, { foreignKey: "userId", as: "partyVotes", constraints: true });
Movie.hasMany(PartyVote, { foreignKey: "movieId", constraints: true });

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
