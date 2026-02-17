const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const UserMovieProfile = sequelize.define(
  "UserMovieProfile",
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
    movies: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: "Array of selected movies with details"
    }
  },
  {
    tableName: "UserMovieProfiles",
    freezeTableName: true,
    timestamps: true
  }
);

UserMovieProfile.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });

module.exports = UserMovieProfile;
