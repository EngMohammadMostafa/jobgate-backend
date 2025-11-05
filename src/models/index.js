const sequelize = require("../config/db.config");
const User = require("./user.model");
const Company = require("./company.model");
const CompanyRequest = require("./companyRequest.model");
const Notification = require("./notification.model");
const Admin = require("./admin.model");

Company.hasMany(User, { foreignKey: "company_id", onDelete: "CASCADE" });
User.belongsTo(Company, { foreignKey: "company_id" });
Admin.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE" });
module.exports = {
  sequelize,
  User,
  Company,
  CompanyRequest,
  Notification,
  Admin,
};
