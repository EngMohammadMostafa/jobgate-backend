const express = require("express");
const router = express.Router();
const companyRequestController = require("../controllers/companyRequests.controller");
// ⚠️ يجب التأكد من مسار استدعاء الميدل وير الخاص بك
const protect = require("../middleware/authJwt.js"); // افتراض وجود ميدل وير المصادقة
const adminOnly = require("../middleware/verifyAdmin"); // استخدام الميدل وير الذي قدمته

// 1. مسار إنشاء طلب جديد (متاح للعامة/غير المصادقين)
// POST /api/requests
router.post("/", companyRequestController.createRequest);

// 2. مسارات تتطلب أن يكون المستخدم مُسجلاً الدخول ومسؤول (Admin)
// يتم تطبيق protect أولاً لإنشاء req.user، ثم adminOnly للتحقق من الدور.
const adminAccess = [protect, adminOnly];

// GET /api/requests
router.get("/", adminAccess, companyRequestController.getAllRequests);

// GET /api/requests/:id
router.get("/:id", adminAccess, companyRequestController.getRequestById);

// PUT /api/requests/approve/:id
router.put(
  "/approve/:id",
  adminAccess,
  companyRequestController.approveRequest
);

// PUT /api/requests/reject/:id
router.put("/reject/:id", adminAccess, companyRequestController.rejectRequest);

module.exports = router;
