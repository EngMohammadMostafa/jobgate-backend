// file: src/routes/companyRequests.routes.js (المُصلَح)
const express = require("express");
const router = express.Router();
const companyRequestController = require("../controllers/companyRequests.controller");
const authJwt = require("../middleware/authJwt");
const verifyAdmin = require("../middleware/verifyAdmin");

// 1. مسار إنشاء طلب جديد (متاح للعامة/غير المصادقين)
// POST /api/company-requests
router.post("/", companyRequestController.createRequest);

// 2. مسارات تتطلب أن يكون المستخدم مُسجلاً الدخول ومسؤول (Admin)
const adminAccess = [authJwt.verifyToken, verifyAdmin];

// GET /api/company-requests - عرض جميع الطلبات
router.get("/", adminAccess, companyRequestController.getAllRequests);

// GET /api/company-requests/:id - عرض تفاصيل طلب محدد
router.get("/:id", adminAccess, companyRequestController.getRequestById);

// PUT /api/company-requests/approve/:id - الموافقة على طلب
router.put("/approve/:id", adminAccess, companyRequestController.approveRequest);

// PUT /api/company-requests/reject/:id - رفض طلب
router.put("/reject/:id", adminAccess, companyRequestController.rejectRequest);

module.exports = router;
// const express = require("express");
// const router = express.Router();
// const companyRequestController = require("../controllers/companyRequests.controller");
// //   يجب التأكد من مسار استدعاء الميدل وير الخاص بك
// const protect = require("../middleware/authJwt.js");  
// const adminOnly = require("../middleware/verifyAdmin");  
// // 1. مسار إنشاء طلب جديد (متاح للعامة/غير المصادقين)
// // POST /api/requests
// router.post("/", companyRequestController.createRequest);

// // 2. مسارات تتطلب أن يكون المستخدم مُسجلاً الدخول ومسؤول (Admin)
 
// const adminAccess = [protect, adminOnly];

// // GET /api/requests
// router.get("/", adminAccess, companyRequestController.getAllRequests);

// // GET /api/requests/:id
// router.get("/:id", adminAccess, companyRequestController.getRequestById);

// // PUT /api/requests/approve/:id
// router.put(
//   "/approve/:id",
//   adminAccess,
//   companyRequestController.approveRequest
// );

// // PUT /api/requests/reject/:id
// router.put("/reject/:id", adminAccess, companyRequestController.rejectRequest);

// module.exports = router;
