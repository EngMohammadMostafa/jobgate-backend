// file: src/routes/push.routes.js

const express = require("express");
const router = express.Router();
const pushController = require("../controllers/push.controller");
const authJwt = require("../middleware/authJwt");
const verifyAdmin = require("../middleware/verifyAdmin");

//   يجب أن يكون محمياً بـ authJwt و verifyAdmin
router.post("/send", authJwt, verifyAdmin, pushController.sendPushToUser);

router.get("/", authJwt, verifyAdmin, pushController.listSentPushNotifications);

module.exports = router;
