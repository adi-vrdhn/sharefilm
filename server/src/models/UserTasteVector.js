const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const UserTasteVector = sequelize.define(
  "UserTasteVector",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    taste_vector: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: "Genre-based taste vector: {action: 0.8, comedy: -0.3, ...}"
    },
    total_rated_movies: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Count of MY TYPE + Nahhh ratings"
    },
    genres_count: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Count of each genre seen (for statistics)"
    },
    last_updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: "user_taste_vectors",
    timestamps: false,
    underscored: true
  }
);

module.exports = UserTasteVector;
