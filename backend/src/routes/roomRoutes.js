const express = require("express");
const router = express.Router();

const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} = require("../controller/roomController.js");

const { verifyToken, checkRole } = require("../middleware/authMiddleware");

// Ai cũng xem được danh sách phòng (khách chưa đăng nhập vẫn cần duyệt phòng)
router.get("/", getRooms);
router.get("/:id", getRoomById);

// Chỉ admin mới được thêm/sửa/xóa phòng
router.post("/", verifyToken, checkRole("admin"), createRoom);
router.put("/:id", verifyToken, checkRole("admin"), updateRoom);
router.delete("/:id", verifyToken, checkRole("admin"), deleteRoom);

module.exports = router;