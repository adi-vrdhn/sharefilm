const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const TasteMatchSession = sequelize.define(
  "TasteMatchSession",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "First user who initiated voting"
    },
    friend_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Second user (friend's profile)"
    },
    user_votes_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Number of movies user_id voted on"
    },
    friend_votes_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Number of movies friend_id voted on"
    },
    user_completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Timestamp when user_id completed 20 votes"
    },
    friend_completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Timestamp when friend_id completed 20 votes"
    },
    session_status: {
      type: DataTypes.STRING,
      defaultValue: "voting_in_progress",
      allowNull: false,
      validate: {
        isIn: [["voting_in_progress", "both_voted", "report_generated"]]
      },
      comment: "Current state of voting session"
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: "taste_match_sessions",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["user_id", "friend_id"],
        unique: true,
        name: "unique_taste_session"
      }
    ]
  }
);

module.exports = TasteMatchSession;
