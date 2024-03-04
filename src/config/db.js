const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("./dbConfig");
db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// models
db.userModel = require("../models/user")(sequelize, DataTypes);
db.bookingModel = require("../models/booking")(sequelize, DataTypes);

//relation
db.userModel.hasOne(db.bookingModel, { foreignKey: "userId" });
db.bookingModel.belongsTo(db.userModel, {
  foreignKey: "userId",
});

sequelize
  .sync({
    // force: true,
  })
  .then(() => {
    console.log("Models synced ");
  });
module.exports = db;
