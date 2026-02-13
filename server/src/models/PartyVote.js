const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

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
      references: {
        model: "Parties",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    movieId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Movies",
        key: "id",
      },
    },
  },
  {
    timestamps: true,
    tableName: "PartyVotes",
  }
);

module.exports = PartyVote;
