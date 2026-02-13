const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PartyMovie = sequelize.define(
  "PartyMovie",
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
    tableName: "PartyMovies",
  }
);

module.exports = PartyMovie;
