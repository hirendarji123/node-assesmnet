const { Sequelize } = require("sequelize");
require("dotenv").config();
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      connectTimeout: 60000, // 60 seconds
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    pool: {
      min: 0,
      max: 10,
      idle: 60000,
      acquire: 5000,
    },
  }
);
// models

// connecting database
try {
  sequelize.authenticate().then(() => {
    console.log("DATABASE CONNECTED SUCCESSFULLY.");
  });
} catch (err) {
  console.log("ERROR WHILE CONNECTING DATABASE:", err);
}

module.exports = sequelize;
