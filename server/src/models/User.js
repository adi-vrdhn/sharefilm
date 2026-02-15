const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ""
    },
    profilePicture: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      comment: "Base64 encoded image or URL"
    }
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true
  }
);

module.exports = User;
