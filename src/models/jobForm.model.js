// file: models/jobForm.model.js (المعدل)

const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const JobForm = sequelize.define("JobForm", {
  form_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  require_cv: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  // job_id (FK)
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = JobForm;
