const express = require("express");
const router = express.Router();

const { getDashboardStats } = require("../controller/dashboardController.js");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");

router.get("/stats", verifyToken, checkRole("admin"), getDashboardStats);

module.exports = router;
