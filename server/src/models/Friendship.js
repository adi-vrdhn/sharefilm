const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Friendship = sequelize.define(
  "Friendship",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id"
    },
    friendId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "friend_id"
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted"),
      defaultValue: "accepted",
      allowNull: false
    }
  },
  {
    tableName: "friendships",
    timestamps: false,
    underscored: true
  }
);

module.exports = Friendship;
