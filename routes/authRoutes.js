const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signin", authController.signin);
router.post("/signup", authController.signup);
router.post("/signout", authController.signout);
router.get("/me", authController.protectedRoute, authController.getMe);

module.exports = router;
