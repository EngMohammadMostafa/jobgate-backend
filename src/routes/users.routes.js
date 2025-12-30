// file: src/routes/user.routes.js

const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const notificationController = require("../controllers/push.controller");
const cvController = require("../controllers/cv.controller");
const companyController = require("../controllers/companies.controller");
const { verifyToken } = require("../middleware/authJwt"); // ✅ استخدم verifyToken فقط
const { uploadCV } = require("../middleware/upload.middleware"); 

// --- الوصول العام (Public Access) ---
router.get("/job-postings", userController.listJobPostings);  
router.get("/job-postings/:id", userController.getJobPostingDetails);  
router.get("/companies", companyController.getAllCompanies);  
router.get("/companies/:id", companyController.getCompanyById);  
router.post("/company-requests", companyController.submitCompanyRequest);  

// --- الباحث عن عمل (يتطلب مصادقة) ---
// الطلبات والسير الذاتية
router.post(
  "/applications",
  verifyToken,
  uploadCV,
  userController.submitApplication
);  
router.get("/applications/user", verifyToken, userController.listUserApplications);  
router.get("/profile/cv", verifyToken, cvController.listUserCVs);  
router.put("/profile/cv", verifyToken, uploadCV, cvController.uploadNewCV);  

// الإشعارات
router.get(
  "/notifications",
  verifyToken,
  notificationController.listSentPushNotifications
);  
router.get(
  "/notifications/:id",
  verifyToken,
  notificationController.getNotificationDetails
);  
router.get(
  "/notifications/unread",
  verifyToken,
  notificationController.listSentPushNotifications
);  
router.put(
  "/notifications/:id/read",
  verifyToken,
  notificationController.markNotificationAsRead
);  

module.exports = router;
