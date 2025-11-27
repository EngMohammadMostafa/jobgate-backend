const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const CVStructuredData = sequelize.define("CV_Structured_Data", {
  cv_struct_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  data_json: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  // cv_id (FK)
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  last_updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = CVStructuredData;
