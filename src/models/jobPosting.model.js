const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const JobPosting = sequelize.define("JobPosting", {
  job_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  requirements: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  salary_min: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  salary_max: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("open", "closed"),
    defaultValue: "open",
    allowNull: false,
  },
  form_type: {
    type: DataTypes.ENUM("external_link", "internal_form"),
    allowNull: false,
  },
  external_form_url: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { isUrl: true },
  },
  // company_id (FK)
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = JobPosting;
