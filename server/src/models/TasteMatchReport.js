const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const TasteMatchReport = sequelize.define(
  "TasteMatchReport",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "One user in the match pair"
    },
    friend_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Other user in the match pair"
    },
    match_percentage: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "Match percentage (0-100)"
    },
    similarity_score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "Cosine similarity score (-1 to 1)"
    },
    genre_compatibility: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: "Per-genre compatibility scores"
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "Human-readable match summary"
    },
    user_total_ratings: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Total ratings by user_id during this match"
    },
    friend_total_ratings: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Total ratings by friend_id during this match"
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: "taste_match_reports",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ["user_id", "friend_id"],
        unique: true,
        name: "unique_taste_report"
      }
    ]
  }
);

module.exports = TasteMatchReport;
