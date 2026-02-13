require("dotenv").config();
const sequelize = require("./src/config/db");
const User = require("./src/models/User");

async function deleteUsers() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected\n");

    // List all users
    const users = await User.findAll({
      attributes: ["id", "name", "email", "createdAt"]
    });

    console.log("📋 All Users:");
    console.log("================");
    users.forEach((user, idx) => {
      console.log(`${idx + 1}. ID: ${user.id} | Name: ${user.name} | Email: ${user.email} | Created: ${user.createdAt}`);
    });
    console.log("================\n");

    // Delete specific users
    const userIdsToDelete = process.argv.slice(2).map(Number);

    if (userIdsToDelete.length === 0) {
      console.log("❌ No user IDs provided.");
      console.log("\nUsage: node deleteUsers.js <id1> <id2> <id3>");
      console.log("Example: node deleteUsers.js 1 3 5\n");
      process.exit(0);
    }

    console.log(`🗑️  Deleting users with IDs: ${userIdsToDelete.join(", ")}`);
    const result = await User.destroy({
      where: {
        id: userIdsToDelete
      }
    });

    console.log(`✅ Deleted ${result} user(s)\n`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

deleteUsers();
