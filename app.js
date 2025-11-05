const express = require("express");
const cors = require("cors");
const sequelize = require("./src/config/db.config");

//   routes
const usersRoutes = require("./src/routes/users.routes");
const companiesRoutes = require("./src/routes/companies.routes");
const companyRequestsRoutes = require("./src/routes/companyRequests.routes");
const authRoutes = require("./src/routes/auth.routes");
const notificationsRoutes = require("./src/routes/notifications.routes");

const app = express();
app.use(cors());
app.use(express.json());

//   استخدام الراوترات
app.use("/api/users", usersRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/company-requests", companyRequestsRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/notifications", notificationsRoutes);

//   مزامنة قاعدة البيانات
sequelize
  .sync({ alter: true })
  .then(() => console.log("  Database synced successfully"));

module.exports = app;
