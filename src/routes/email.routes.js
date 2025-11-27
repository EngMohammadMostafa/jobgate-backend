// file: src/routes/email.routes.js

const express = require("express");
const router = express.Router();
const emailController = require("../controllers/email.controller");
const authJwt = require("../middleware/authJwt");
const verifyAdmin = require("../middleware/verifyAdmin");

//  يجب أن يكون محمياً بـ authJwt و verifyAdmin
router.post("/send", authJwt, verifyAdmin, emailController.sendEmailToCompany);

router.get("/", authJwt, verifyAdmin, emailController.listSentEmails);

module.exports = router;
