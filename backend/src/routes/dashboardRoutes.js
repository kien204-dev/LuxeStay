const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getDashboardAnalytics,
} = require("../controller/dashboardController.js");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");

router.get("/stats", verifyToken, checkRole("admin"), getDashboardStats);
router.get("/analytics", verifyToken, checkRole("admin"), getDashboardAnalytics);

module.exports = router;
