// file: src/routes/companies.routes.js (المُحدَّث)
const express = require("express");
const router = express.Router();
const companiesController = require("../controllers/companies.controller");
const jobPostingController = require("../controllers/jobPosting.controller"); // ⬅️ إضافة جديدة
const verifyAdmin = require("../middleware/verifyAdmin");
const authJwt = require("../middleware/authJwt");
const verifyCompany = require("../middleware/verifyCompany");

// ----------------------------------------------------------------------
//                      المسارات العامة (Public)
// ----------------------------------------------------------------------

router.get("/", companiesController.listApprovedCompanies);

// ----------------------------------------------------------------------
//                  المسارات الخاصة بالأدمن (Admin Only)
// ----------------------------------------------------------------------

router.post("/", authJwt.verifyToken, verifyAdmin, companiesController.createCompany);
router.get("/admin/all", authJwt.verifyToken, verifyAdmin, companiesController.getAllCompanies);
router.get("/admin/:id", authJwt.verifyToken, verifyAdmin, companiesController.getCompanyById);
router.put("/admin/:id", authJwt.verifyToken, verifyAdmin, companiesController.updateCompany);
router.delete("/admin/:id", authJwt.verifyToken, verifyAdmin, companiesController.deleteCompany);

// ----------------------------------------------------------------------
//          المسارات الخاصة بالشركة (Company Dashboard)
// ----------------------------------------------------------------------

router.get("/company/profile", authJwt.verifyToken, verifyCompany, companiesController.getCompanyProfile);
router.put("/company/profile", authJwt.verifyToken, verifyCompany, companiesController.updateCompanyProfile);
router.get("/company/applications", authJwt.verifyToken, verifyCompany, companiesController.getCompanyApplications);
router.put("/company/applications/:id", authJwt.verifyToken, verifyCompany, companiesController.updateApplicationStatus);

// ----------------------------------------------------------------------
//          مسارات إعلانات التوظيف للشركة (الجديدة) ⬅️ ⬅️ ⬅️
// ----------------------------------------------------------------------

router.post("/company/job-postings", [authJwt.verifyToken, verifyCompany], jobPostingController.createJobPosting);
router.get("/company/job-postings", [authJwt.verifyToken, verifyCompany], jobPostingController.getCompanyJobPostings);
router.put("/company/job-postings/:id", [authJwt.verifyToken, verifyCompany], jobPostingController.updateJobPosting);
router.put("/company/job-postings/:id/toggle", [authJwt.verifyToken, verifyCompany], jobPostingController.toggleJobPostingStatus);
router.post("/company/job-forms", [authJwt.verifyToken, verifyCompany], jobPostingController.createJobForm);

// ----------------------------------------------------------------------
// يجب أن يكون آخر مسار دائماً حتى لا يتعارض مع البقية
// ----------------------------------------------------------------------

router.get("/:id", companiesController.getApprovedCompanyDetails);

module.exports = router;

// // file: src/routes/companies.routes.js
// const express = require("express");
// const router = express.Router();
// const companiesController = require("../controllers/companies.controller");
// const verifyAdmin = require("../middleware/verifyAdmin");
// const authJwt = require("../middleware/authJwt");
// const verifyCompany = require("../middleware/verifyCompany");

// // ----------------------------------------------------------------------
// //                      المسارات العامة (Public)
// // ----------------------------------------------------------------------

// router.get("/", companiesController.listApprovedCompanies);

// // ----------------------------------------------------------------------
// //                  المسارات الخاصة بالأدمن (Admin Only)
// // ----------------------------------------------------------------------

// router.post("/", authJwt.verifyToken, verifyAdmin, companiesController.createCompany);
// router.get("/admin/all", authJwt.verifyToken, verifyAdmin, companiesController.getAllCompanies);
// router.get("/admin/:id", authJwt.verifyToken, verifyAdmin, companiesController.getCompanyById);
// router.put("/admin/:id", authJwt.verifyToken, verifyAdmin, companiesController.updateCompany);
// router.delete("/admin/:id", authJwt.verifyToken, verifyAdmin, companiesController.deleteCompany);

// // ----------------------------------------------------------------------
// //          المسارات الخاصة بالشركة (Company Dashboard)
// // ----------------------------------------------------------------------

// router.get("/company/profile", authJwt.verifyToken, verifyCompany, companiesController.getCompanyProfile);
// router.put("/company/profile", authJwt.verifyToken, verifyCompany, companiesController.updateCompanyProfile);
// router.get("/company/applications", authJwt.verifyToken, verifyCompany, companiesController.getCompanyApplications);
// router.put("/company/applications/:id", authJwt.verifyToken, verifyCompany, companiesController.updateApplicationStatus);

// // ----------------------------------------------------------------------
// // يجب أن يكون آخر مسار دائماً حتى لا يتعارض مع البقية
// // ----------------------------------------------------------------------

// router.get("/:id", companiesController.getApprovedCompanyDetails);

// module.exports = router;
