const express = require("express");
const router = express.Router();

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controller/userController.js");

const {
  verifyToken,
  checkRole,
} = require("../middleware/authMiddleware");

// Chỉ admin mới được xem danh sách user
router.get("/users", verifyToken, checkRole("admin"), getUsers);

// Chỉ admin mới được xem chi tiết user
router.get("/users/:id", verifyToken, checkRole("admin"), getUserById);

// Chỉ admin mới được tạo user
router.post("/users", verifyToken, checkRole("admin"), createUser);

// Chỉ admin mới được sửa user
router.put("/users/:id", verifyToken, checkRole("admin"), updateUser);

// Chỉ admin mới được xóa user
router.delete("/users/:id", verifyToken, checkRole("admin"), deleteUser);

module.exports = router;