const { Sequelize } = require("sequelize");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: false,
  dialectOptions:
    process.env.NODE_ENV === "production" || databaseUrl.includes("supabase")
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      : {}
});

module.exports = sequelize;
