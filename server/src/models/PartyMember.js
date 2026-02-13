const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

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
  },
  {
    timestamps: true,
    tableName: "PartyMembers",
  }
);

module.exports = PartyMember;
