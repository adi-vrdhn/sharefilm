const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PartyVote = sequelize.define(
  "PartyVote",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    partyId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    movieId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: "PartyVotes",
  }
);

module.exports = PartyVote;
