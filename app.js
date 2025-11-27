// file: app.js (الملف المُحدَّث)

const express = require("express");
const cors = require("cors");
const sequelize = require("./src/config/db.config");

// 1. استيراد الراوترات المحدثة
const authRoutes = require("./src/routes/auth.routes");
const adminRoutes = require("./src/routes/admin.routes");
const jobseekerRoutes = require("./src/routes/users.routes");
const companyRoutes = require("./src/routes/companies.routes");
const companyRequestsRoutes = require("./src/routes/companyRequests.routes"); // ⬅️ إضافة جديدة

const app = express();
app.use(cors());
app.use(express.json());
// مسارات المصادقة
app.use("/api/auth", authRoutes);

// مسارات الباحث عن عمل (عامة ومصادق عليها)
app.use("/api", jobseekerRoutes);

// مسارات طلبات الشركات (عامة + إدمن) ⬅️ إضافة جديدة
app.use("/api/company-requests", companyRequestsRoutes);

// مسارات الشركات (عامة + إدمن + لوحة تحكم الشركة)
app.use("/api/companies", companyRoutes);

// مسارات الأدمن (محمية بـ authJwt و verifyAdmin)
app.use("/api/admin", adminRoutes);

// مزامنة قاعدة البيانات
sequelize
  .sync({ alter: true })
  .then(() => console.log("✅ Database synced successfully"))
  .catch((err) => console.error("❌ Database sync failed:", err));

module.exports = app;
