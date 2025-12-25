require("dotenv").config(); // تحميل متغيرات البيئة مبكراً
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const sequelize = require("./src/config/db.config");

// =====================
// Routes Imports
// =====================
const authRoutes = require("./src/routes/auth.routes");
const adminRoutes = require("./src/routes/admin.routes");
const jobseekerRoutes = require("./src/routes/users.routes");
const companyRoutes = require("./src/routes/companies.routes");
const consaultantRoutes = require("./src/routes/consultant.routes");
const companyRequestsRoutes = require("./src/routes/companyRequests.routes");
const aiRoutes = require("./src/routes/ai.routes");
const pushRoutes = require("./src/routes/push.routes");
const emailRoutes = require("./src/routes/email.routes");

// 🆕 CV Purchase Requests
const companyCVRequestRoutes = require("./src/routes/companyCVRequest.routes");
const adminCVRequestRoutes = require("./src/routes/companyCVRequest.admin.routes");
const adminCVMatchingRoutes = require("./src/routes/companyCVMatching.routes");

const app = express();

// =====================
// Storage Folders
// =====================
const uploadsDir = path.join(__dirname, "uploads");
const cvsDir = path.join(uploadsDir, "cvs");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(cvsDir)) fs.mkdirSync(cvsDir, { recursive: true });

// =====================
// Middleware
// =====================
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =====================
// API Routes
// =====================

// Auth
app.use("/api/auth", authRoutes);

// Job Seeker & Consultant
app.use("/api", jobseekerRoutes);
app.use("/api", consaultantRoutes);

// Company Requests (Company Approval)
app.use("/api/company-requests", companyRequestsRoutes);

// Companies
app.use("/api/companies", companyRoutes);

// Admin
app.use("/api/admin", adminRoutes);

// 🆕 Company CV Purchase Requests
app.use("/api/company/cv-requests", companyCVRequestRoutes);
app.use("/api/admin/cv-requests", adminCVRequestRoutes);
app.use("/api/admin/cv-matching", adminCVMatchingRoutes);
// AI
app.use("/api/ai", aiRoutes);

// Push Notifications
app.use("/api/push", pushRoutes);

// Email
app.use("/api/email", emailRoutes);

// =====================
// Health Check
// =====================
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "Job Gate Backend",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    ai_service_enabled: process.env.ENABLE_AI_FEATURES === "true",
    ai_service_url:
      process.env.AI_SERVICE_URL ||
      `http://localhost:${process.env.AI_SERVICE_PORT || 8000}`,
  });
});

// =====================
// 404 Handler
// =====================
app.use((req, res) => {
  res.status(404).json({ message: "المسار غير موجود" });
});

// =====================
// Error Handler
// =====================
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    message: "حدث خطأ داخلي في السيرفر",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// =====================
// Database Sync
// =====================
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("✅ Database synced successfully");

    if (process.env.ENABLE_AI_FEATURES === "true") {
      console.log("🤖 AI Features: Enabled");
      console.log(
        `🔗 AI Service URL: ${
          process.env.AI_SERVICE_URL || "http://localhost:8000"
        }`
      );
    } else {
      console.log("🤖 AI Features: Disabled");
    }
  })
  .catch((err) => {
    console.error("❌ Database sync failed:", err);
    process.exit(1);
  });

module.exports = app;
// require("dotenv").config(); // ← تحميل متغيرات البيئة مبكراً
// const express = require("express");
// const cors = require("cors");
// const path = require("path");
// const fs = require("fs");
// const sequelize = require("./src/config/db.config");

// //    استيراد الراوترات
// const authRoutes = require("./src/routes/auth.routes");
// const adminRoutes = require("./src/routes/admin.routes");
// const jobseekerRoutes = require("./src/routes/users.routes");
// const companyRoutes = require("./src/routes/companies.routes");
// const consaultantRoutes = require("./src/routes/consultant.routes");
// const companyRequestsRoutes = require("./src/routes/companyRequests.routes");
// const aiRoutes = require("./src/routes/ai.routes");
// const pushRoutes = require("./src/routes/push.routes");
// const emailRoutes = require("./src/routes/email.routes");

// const app = express();

// // تأكد من وجود مجلدات التخزين
// const uploadsDir = path.join(__dirname, "uploads");
// const cvsDir = path.join(uploadsDir, "cvs");
// if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
// if (!fs.existsSync(cvsDir)) fs.mkdirSync(cvsDir, { recursive: true });

// // Middleware
// app.use(cors({ origin: process.env.CORS_ORIGIN || "*" })); // استخدم CORS من .env
// app.use(express.json());
// app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // خدمة الملفات المرفوعة

// //               مسارات API

// // مسارات المصادقة
// app.use("/api/auth", authRoutes);

// // مسارات الباحث عن عمل (عامة ومصادق عليها)
// app.use("/api", jobseekerRoutes);
// app.use("/api", consaultantRoutes);

// // مسارات طلبات الشركات (عامة + إدمن)
// app.use("/api/company-requests", companyRequestsRoutes);

// // مسارات الشركات (عامة + إدمن + لوحة تحكم الشركة)
// app.use("/api/companies", companyRoutes);

// // مسارات الأدمن (محمية بـ authJwt و verifyAdmin)
// app.use("/api/admin", adminRoutes);

// // مسارات الذكاء الاصطناعي (AI)
// app.use("/api/ai", aiRoutes);

// // مسارات الدفع (Push Notifications)
// app.use("/api/push", pushRoutes);

// // مسارات البريد الإلكتروني
// app.use("/api/email", emailRoutes);

// //          Health Check Route
// app.get("/api/health", (req, res) => {
//   res.status(200).json({
//     status: "healthy",
//     service: "Job Gate Backend",
//     version: "1.0.0",
//     timestamp: new Date().toISOString(),
//     ai_service_enabled: process.env.ENABLE_AI_FEATURES === "true",
//     ai_service_url:
//       process.env.AI_SERVICE_URL ||
//       `http://localhost:${process.env.AI_SERVICE_PORT || 8000}`,
//   });
// });

// // 404 handler (قبل error handler العام)
// app.use((req, res) => {
//   res.status(404).json({ message: "المسار غير موجود" });
// });

// //          Error Handling Middleware
// app.use((err, req, res, next) => {
//   console.error("Server Error:", err);
//   res.status(500).json({
//     message: "حدث خطأ داخلي في السيرفر",
//     error: process.env.NODE_ENV === "development" ? err.message : undefined,
//   });
// });

// //          Database Sync
// sequelize
//   .sync({ alter: true })
//   .then(() => {
//     console.log("✅ Database synced successfully");

//     // التحقق من اتصال AI service إذا كان مفعلاً
//     if (process.env.ENABLE_AI_FEATURES === "true") {
//       console.log("🤖 AI Features: Enabled");
//       console.log(
//         `🔗 AI Service URL: ${
//           process.env.AI_SERVICE_URL || "http://localhost:8000"
//         }`
//       );
//     } else {
//       console.log("🤖 AI Features: Disabled");
//     }
//   })
//   .catch((err) => {
//     console.error("❌ Database sync failed:", err);
//     process.exit(1);
//   });

// module.exports = app;
