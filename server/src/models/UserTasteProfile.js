const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const UserTasteProfile = sequelize.define(
  "UserTasteProfile",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    preferredLanguages: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: "Array of language codes user prefers"
    },
    movieRangePreference: {
      type: DataTypes.STRING,
      defaultValue: "mixed"
    }
  },
  {
    tableName: "UserTasteProfiles",
    freezeTableName: true,
    timestamps: true
  }
);

UserTasteProfile.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });

module.exports = UserTasteProfile;
