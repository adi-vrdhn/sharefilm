const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SwipeEvent = sequelize.define(
  "SwipeEvent",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id"
    },
    tmdbId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "tmdb_id"
    },
    action: {
      type: DataTypes.ENUM("nah", "watched", "want"),
      allowNull: false
    },
    genreIds: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "genre_ids"
    },
    providerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "provider_id"
    },
    language: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_pinned"
    },
    pinOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "pin_order"
    }
  },
  {
    tableName: "swipe_events",
    timestamps: true,
    underscored: true
  }
);

module.exports = SwipeEvent;
