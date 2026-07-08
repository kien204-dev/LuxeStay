const express = require("express");
const router = express.Router();

const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} = require("../controller/roomController.js");
const { uploadRoomImage: uploadRoomImageController } = require("../controller/uploadController.js");
const { uploadRoomImage } = require("../middleware/roomImageUpload.js");

const { verifyToken, checkRole } = require("../middleware/authMiddleware");

function handleRoomImageUpload(req, res, next) {
  uploadRoomImage.single("image")(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Image size must be 2MB or smaller",
      });
    }

    return res.status(400).json({
      message: err.message || "Image upload failed",
    });
  });
}

// Ai cũng xem được danh sách phòng (khách chưa đăng nhập vẫn cần duyệt phòng)
router.get("/", getRooms);
router.get("/:id", getRoomById);

// Chỉ admin mới được thêm/sửa/xóa phòng
router.post(
  "/upload-image",
  verifyToken,
  checkRole("admin"),
  handleRoomImageUpload,
  uploadRoomImageController
);
router.post("/", verifyToken, checkRole("admin"), createRoom);
router.put("/:id", verifyToken, checkRole("admin"), updateRoom);
router.delete("/:id", verifyToken, checkRole("admin"), deleteRoom);

module.exports = router;
