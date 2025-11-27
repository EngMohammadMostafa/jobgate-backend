// file: models/index.js (المحدث)

const sequelize = require("../config/db.config");
const User = require("./user.model");
const Company = require("./company.model");
const CompanyRequest = require("./companyRequest.model");
const Admin = require("./admin.model");
// النماذج الجديدة والمعدلة
const JobPosting = require("./jobPosting.model");
const JobForm = require("./jobForm.model");
const JobFormField = require("./jobFormField.model");
const Application = require("./application.model");
const CV = require("./cv.model");
const CVStructuredData = require("./cvStructuredData.model");
const EmailNotification = require("./EmailNotification.model");
const PushNotification = require("./PushNotification.model");

// --- 1. علاقات الشركة (Company) ---
Company.hasMany(JobPosting, { foreignKey: "company_id", onDelete: "CASCADE" });
JobPosting.belongsTo(Company, { foreignKey: "company_id" });

// --- 2. علاقات المستخدم (User - Job Seeker) ---
// المستخدم لديه سير ذاتية متعددة
User.hasMany(CV, { foreignKey: "user_id", onDelete: "CASCADE" });
CV.belongsTo(User, { foreignKey: "user_id" });
// المستخدم يقدم طلبات توظيف
User.hasMany(Application, { foreignKey: "user_id", onDelete: "CASCADE" });
Application.belongsTo(User, { foreignKey: "user_id" });

// --- 3. علاقات الوظيفة (JobPosting) و النموذج (JobForm) ---
// الوظيفة لديها نموذج أسئلة داخلي مرتبط بها
JobPosting.hasOne(JobForm, { foreignKey: "job_id", onDelete: "CASCADE" });
JobForm.belongsTo(JobPosting, { foreignKey: "job_id" });

// الوظيفة تتلقى طلبات توظيف
JobPosting.hasMany(Application, { foreignKey: "job_id", onDelete: "CASCADE" });
Application.belongsTo(JobPosting, { foreignKey: "job_id" });

// --- 4. علاقات النموذج (JobForm) و حقوله (JobFormField) ---
JobForm.hasMany(JobFormField, { foreignKey: "form_id", onDelete: "CASCADE" });
JobFormField.belongsTo(JobForm, { foreignKey: "form_id" });

// --- 5. علاقات الطلب (Application) و السيرة الذاتية (CV) ---
// طلب التوظيف مرتبط بسيرة ذاتية واحدة
Application.belongsTo(CV, { foreignKey: "cv_id", onDelete: "SET NULL" });
CV.hasMany(Application, { foreignKey: "cv_id", onDelete: "SET NULL" });

// --- 6. علاقات السيرة الذاتية (CV) و البيانات المهيكلة (CVStructuredData) ---
// السيرة الذاتية لديها بيانات مهيكلة
CV.hasOne(CVStructuredData, { foreignKey: "cv_id", onDelete: "CASCADE" });
CVStructuredData.belongsTo(CV, { foreignKey: "cv_id" });

// --- 7. علاقات أخرى ---
Company.hasMany(User, { foreignKey: "company_id", onDelete: "SET NULL" });
User.belongsTo(Company, { foreignKey: "company_id" });
Admin.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE" });
EmailNotification.belongsTo(Company, { foreignKey: "company_id" });
PushNotification.belongsTo(User, { foreignKey: "user_id" });

module.exports = {
  sequelize,
  User,
  Company,
  CompanyRequest,

  Admin,
  JobPosting,
  JobForm,
  JobFormField,
  Application,
  CV,
  CVStructuredData,
  EmailNotification,
  PushNotification,
};
