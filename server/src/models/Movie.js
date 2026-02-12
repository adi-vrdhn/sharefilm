const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Movie = sequelize.define(
  "Movie",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    tmdbId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: "tmdb_id"
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    poster: {
      type: DataTypes.STRING,
      allowNull: true
    },
    year: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    tableName: "movies",
    timestamps: false,
    underscored: true
  }
);

module.exports = Movie;
