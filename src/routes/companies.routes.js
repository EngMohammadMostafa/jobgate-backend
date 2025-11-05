const express = require("express");
const router = express.Router();
const companiesController = require("../controllers/companies.controller");
const verifyAdmin = require("../middleware/verifyAdmin"); // لحماية المسارات الحساسة
const authJwt = require("../middleware/authJwt");

router.get("/", companiesController.getAllCompanies);
router.get("/:id", companiesController.getCompanyById);

//   المسارات الخاصة بالأدمن
router.put("/:id", authJwt, verifyAdmin, companiesController.updateCompany);
router.delete("/:id", authJwt, verifyAdmin, companiesController.deleteCompany);

module.exports = router;
