const express = require("express");
const userController = require("../controllers/userController");
const { protectedRoute } = require("../controllers/authController");
const router = express.Router();

router.get("/profile/:id", protectedRoute, userController.getUserProfile);
router.get("/suggested", protectedRoute, userController.getSuggestedUsers);
router.post("/follow/:id", protectedRoute, userController.followUnfollowUser);
router.post("/update", protectedRoute, userController.updateUserProfile);

module.exports = router;
