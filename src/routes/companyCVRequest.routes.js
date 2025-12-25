const express = require("express");
const router = express.Router();
const controller = require("../controllers/company/companyCVRequest.controller");
const authMiddleware = require("../middleware/authJwt");

router.post("/", authMiddleware.verifyToken, controller.createCVRequest);

module.exports = router;