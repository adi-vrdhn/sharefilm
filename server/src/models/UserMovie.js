const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const UserMovie = sequelize.define(
  "UserMovie",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "receiver_id"
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "sender_id"
    },
    movieId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "movie_id"
    },
    dateAdded: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "date_added",
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: "user_movies",
    timestamps: false,
    underscored: true
  }
);

module.exports = UserMovie;
