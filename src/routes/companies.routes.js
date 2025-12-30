const express = require("express");
const router = express.Router();

const companiesController = require("../controllers/companies.controller");
const companyAuthController = require("../controllers/companyAuth.controller"); // 🆕 جديد
const jobPostingController = require("../controllers/jobPosting.controller");

const verifyAdmin = require("../middleware/verifyAdmin");
const { verifyToken } = require("../middleware/authJwt");
const verifyCompany = require("../middleware/verifyCompany");

const uploadJobImage = require("../middleware/uploadJobImage");
const uploadCompanyLogo = require("../middleware/uploadCompanyLogo");

// ----------------------------------------------------------------------
//                      المسارات العامة (Public)
// ----------------------------------------------------------------------

// 📌 تسجيل دخول الشركة
router.post("/login", companyAuthController.loginCompany);

// 📌 تعيين كلمة المرور (أول مرة)
router.post("/set-password", companyAuthController.setCompanyPassword);

// 📌 قائمة الشركات المعتمدة
router.get("/", companiesController.listApprovedCompanies);

// 📌 تفاصيل شركة معتمدة
router.get("/:id", companiesController.getApprovedCompanyDetails);

// ----------------------------------------------------------------------
//                  المسارات الخاصة بالأدمن (Admin Only)
// ----------------------------------------------------------------------

router.post("/", verifyToken, verifyAdmin, companiesController.createCompany);
router.get(
  "/admin/all",
  verifyToken,
  verifyAdmin,
  companiesController.getAllCompanies
);
router.get(
  "/admin/:id",
  verifyToken,
  verifyAdmin,
  companiesController.getCompanyById
);
router.put(
  "/admin/:id",
  verifyToken,
  verifyAdmin,
  companiesController.updateCompany
);
router.delete(
  "/admin/:id",
  verifyToken,
  verifyAdmin,
  companiesController.deleteCompany
);

// ----------------------------------------------------------------------
//                  مسارات لوحة تحكم الشركة (Company)
// ----------------------------------------------------------------------

// 📌 تغيير كلمة المرور
router.put(
  "/company/change-password",
  verifyToken,
  verifyCompany,
  companyAuthController.changeCompanyPassword
);

// 📌 Dashboard
router.get(
  "/company/dashboard",
  verifyToken,
  verifyCompany,
  companiesController.getCompanyDashboard
);

// 📌 Profile
router.get(
  "/company/profile",
  verifyToken,
  verifyCompany,
  companiesController.getCompanyProfile
);

router.put(
  "/company/profile",
  verifyToken,
  verifyCompany,
  uploadCompanyLogo.single("logo"),
  companiesController.updateCompanyProfile
);

// 📌 Applications
router.get(
  "/company/applications",
  verifyToken,
  verifyCompany,
  companiesController.getCompanyApplications
);
router.get(
  "/company/applications/:id",
  verifyToken,
  verifyCompany,
  companiesController.getCompanyApplicationsByID
);

router.put(
  "/company/applications/:id",
  verifyToken,
  verifyCompany,
  companiesController.updateApplicationStatus
);

// ----------------------------------------------------------------------
//                  Job Postings (Company)
// ----------------------------------------------------------------------

// 📌 Create job (with image)
router.post(
  "/company/job-postings",
  verifyToken,
  verifyCompany,
  uploadJobImage.single("job_image"),
  jobPostingController.createJobPosting
);

// 📌 Get company jobs
router.get(
  "/company/job-postings",
  verifyToken,
  verifyCompany,
  jobPostingController.getCompanyJobPostings
);

// 📌 Update job
router.put(
  "/company/job-postings/:id",
  verifyToken,
  verifyCompany,
  jobPostingController.updateJobPosting
);

// 📌 Toggle job status
router.put(
  "/company/job-postings/:id/toggle",
  verifyToken,
  verifyCompany,
  jobPostingController.toggleJobPostingStatus
);

// 📌 Delete job
router.delete(
  "/company/job-postings/:id",
  verifyToken,
  verifyCompany,
  jobPostingController.deleteJobPosting
);

// 📌 Internal job form
router.post(
  "/company/job-forms",
  verifyToken,
  verifyCompany,
  jobPostingController.createJobForm
);

module.exports = router;