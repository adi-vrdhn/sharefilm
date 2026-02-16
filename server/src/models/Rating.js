const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Rating = sequelize.define(
  "Rating",
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
    user_movie_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      validate: {
        min: 0,
        max: 5
      }
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "comments"
    }
  },
  {
    tableName: "ratings",
    timestamps: false,
    underscored: true
  }
);

module.exports = Rating;
