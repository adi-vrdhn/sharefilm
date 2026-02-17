const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const UserTasteMovie = sequelize.define(
  "UserTasteMovie",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    tmdb_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "TMDB movie ID"
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    poster_path: {
      type: DataTypes.STRING,
      allowNull: true
    },
    year: {
      type: DataTypes.STRING,
      allowNull: true
    },
    overview: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    genres: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: "Array of genre IDs from TMDB"
    },
    genre_names: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: "Array of genre names"
    },
    directors: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: "Array of director names"
    },
    cast: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: "Array of actor names"
    },
    vote_average: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: "TMDB vote average rating"
    },
    popularity: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    release_date: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    tableName: "UserTasteMovies",
    freezeTableName: true,
    timestamps: true
  }
);

UserTasteMovie.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });

module.exports = UserTasteMovie;
