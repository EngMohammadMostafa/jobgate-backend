// file: src/routes/auth.routes.js

const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

/**
 *   دوال المصادقة (Public)
 * المسارات: /api/auth/login و /api/auth/register-jobseeker
 */
router.post("/login", userController.login);  
router.post("/register-jobseeker", userController.registerJobSeeker); 

module.exports = router;
