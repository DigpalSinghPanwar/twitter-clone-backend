const express = require("express");
const { protectedRoute } = require("../controllers/authController");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

router.get("/", protectedRoute, notificationController.getNotification);
router.delete("/", protectedRoute, notificationController.deleteNotification);

module.exports = router;
