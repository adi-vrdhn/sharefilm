const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SharedParty = sequelize.define(
  "SharedParty",
  {
    id: {
      type: DataTypes.STRING(4),
      primaryKey: true,
    },
    hostId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "host_id",
    },
    hostName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "host_name",
    },
    movies: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    votes: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "shared_parties",
    timestamps: true,
    underscored: true,
  }
);

module.exports = SharedParty;
