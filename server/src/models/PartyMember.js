const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PartyMember = sequelize.define(
  "PartyMember",
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
  },
  {
    timestamps: true,
    tableName: "PartyMembers",
  }
);

module.exports = PartyMember;
