const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const CV = sequelize.define("CV", {
  cv_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  file_url: {
    type: DataTypes.STRING, // رابط الملف المخزن (S3/Local)
    allowNull: false,
  },
  file_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  title: {
    type: DataTypes.STRING, // اسم السيرة الذاتية (مفيدة للمستخدم إذا كان لديه نسخ متعددة)
    allowNull: true,
  },
  // user_id (FK)
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  last_updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = CV;
