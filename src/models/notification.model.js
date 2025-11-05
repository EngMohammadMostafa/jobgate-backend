const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Notification = sequelize.define("Notification", {
  notification_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  receiver_email: { type: DataTypes.STRING, allowNull: false },
  receiver_type: { type: DataTypes.ENUM("user", "company"), allowNull: false },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
});

module.exports = Notification;
