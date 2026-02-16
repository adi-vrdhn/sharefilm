const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const MovieTasteRating = sequelize.define(
  "MovieTasteRating",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tmdb_movie_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isIn: [[-1, 1]] // -1 = Nahhh, 1 = MY TYPE
      },
      comment: "1 = MY TYPE, -1 = Nahhh"
    },
    movie_title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    genres: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Cached genres from TMDB to avoid repeated API calls"
    },
    popularity: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: "movie_taste_ratings",
    timestamps: false,
    underscored: true
  }
);

module.exports = MovieTasteRating;
