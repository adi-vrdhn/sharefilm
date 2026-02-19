const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PasswordReset = sequelize.define(
  "PasswordReset",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
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
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: "One-time use reset token"
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Token expiration timestamp"
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Timestamp when token was used"
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'updated_at'
    }
  },
  {
    tableName: "password_resets",
    timestamps: true,
    indexes: [
      {
        fields: ["token"],
        unique: true
      },
      {
        fields: ["userId"]
      },
      {
        fields: ["expiresAt"]
      }
    ]
  }
);

module.exports = PasswordReset;
