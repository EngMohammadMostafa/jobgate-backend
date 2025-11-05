const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notifications.controller");
const verifyAdmin = require("../middleware/verifyAdmin");
const authJwt = require("../middleware/authJwt");

router.get("/", authJwt, notificationsController.getAllNotifications);
router.get("/:id", authJwt, notificationsController.getNotificationById);

router.post(
  "/",
  authJwt,
  verifyAdmin,
  notificationsController.createNotification
);
router.put(
  "/:id",
  authJwt,
  verifyAdmin,
  notificationsController.updateNotification
);
router.delete(
  "/:id",
  authJwt,
  verifyAdmin,
  notificationsController.deleteNotification
);

module.exports = router;
