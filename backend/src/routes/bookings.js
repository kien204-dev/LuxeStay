const express = require("express");
const router = express.Router();

const {
  getBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
} = require("../controller/bookingController.js");

const { verifyToken, checkRole } = require("../middleware/authMiddleware");

router.get("/", verifyToken, getBookings);
router.get("/:id", verifyToken, getBookingById);
router.post("/", verifyToken, createBooking);
router.patch("/:id/cancel", verifyToken, cancelBooking);
router.put("/:id", verifyToken, checkRole("admin"), updateBookingStatus);
router.delete("/:id", verifyToken, checkRole("admin"), deleteBooking);

module.exports = router;
