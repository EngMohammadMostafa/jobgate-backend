const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users.controller");
const verifyAdmin = require("../middleware/verifyAdmin");
const authJwt = require("../middleware/authJwt");

router.get("/", usersController.getAllUsers);
router.get("/:id", usersController.getUserById);
router.post("/", usersController.createUser);

//   المسارات الخاصة بالأدمن فقط
router.post("/", authJwt, verifyAdmin, usersController.createUser);
router.put("/:id", authJwt, verifyAdmin, usersController.updateUser);
router.delete("/:id", authJwt, verifyAdmin, usersController.deleteUser);

module.exports = router;
