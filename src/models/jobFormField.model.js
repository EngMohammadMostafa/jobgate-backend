// file: models/jobFormField.model.js (المعدل)

const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const JobFormField = sequelize.define("JobFormField", {
  field_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING, // نص السؤال/الحقل
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  input_type: {
    type: DataTypes.ENUM(
      "text",
      "number",
      "email",
      "file",
      "select",
      "textarea"
    ),
    allowNull: false,
  },
 });

module.exports = JobFormField;
