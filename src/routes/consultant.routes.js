// file: src/routes/consultant.routes.js

const express = require("express");
const router = express.Router();
const consultantController = require("../controllers/consultant.controller");
const { verifyToken } = require("../middleware/authJwt");
const verifyAdmin = require("../middleware/verifyAdmin");
// ===================================
// أ. مسارات الإدارة (Admin Only)
// ===================================

// معالجة طلبات الترقية (قبول/رفض)
router.put(
  "/admin/upgrade/:user_id",
  verifyToken,
  verifyAdmin,
  consultantController.handleConsultantUpgrade
);

// عرض قائمة بطلبات الترقية المعلقة (دالة يجب إضافتها للكنترولر)
// router.get("/admin/upgrade/pending", [authJwt, isAdmin], consultantController.listPendingUpgrades);

// ===================================
// ب. مسارات المستخدم (User Private Access)
// ===================================

// طلب ترقية إلى مستشار
router.post(
  "/user/upgrade",
  verifyToken,
  consultantController.requestConsultantUpgrade
);

// ===================================
// ج. مسارات الوصول العام/الخاصة بالاستشاريين (Public/Private)
// ===================================

// 1. عرض بروفايل المستشار (للمستخدم العادي والشركة والإداري)
router.get("/:user_id", consultantController.getConsultantProfile);
router.get("/", consultantController.getAllConsultants);

// 2. زر طلب استشارة (للمستخدم العادي والشركة)
router.post(
  "/:user_id/request-consultation",
  verifyToken, // يتطلب أن يكون المستخدم مصادقاً (سواء seeker أو company)
  consultantController.requestConsultation
);

module.exports = router;
