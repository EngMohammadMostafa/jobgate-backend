const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Company = sequelize.define("Company", {
  company_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  logo_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  license_doc_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  is_approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // مادامت في هذا الجدول فهي معتمدة
    allowNull: false,
  },
});

module.exports = Company;
