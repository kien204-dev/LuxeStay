const pool = require("../db/db.js");

// ======================
// GET ALL ROOMS
// ======================
exports.getRooms = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, room_name, room_type, price, description, capacity, image, status, created_at
       FROM rooms
       ORDER BY id ASC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================
// GET ROOM BY ID
// ======================
exports.getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, room_name, room_type, price, description, capacity, image, status, created_at
       FROM rooms
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================
// CREATE ROOM
// ======================
exports.createRoom = async (req, res) => {
  try {
    const {
      room_name,
      room_type,
      price,
      description,
      capacity,
      image,
      status,
    } = req.body;

    if (!room_name || !room_type || price === undefined || price === null) {
      return res.status(400).json({
        message: "room_name, room_type và price là bắt buộc",
      });
    }

    const result = await pool.query(
      `INSERT INTO rooms(room_name, room_type, price, description, capacity, image, status)
       VALUES($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, room_name, room_type, price, description, capacity, image, status, created_at`,
      [
        room_name,
        room_type,
        price,
        description || null,
        capacity || 2,
        image || null,
        status || "available",
      ]
    );

    res.status(201).json({
      message: "Tạo phòng thành công",
      room: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================
// UPDATE ROOM
// ======================
exports.updateRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      room_name,
      room_type,
      price,
      description,
      capacity,
      image,
      status,
    } = req.body;

    const result = await pool.query(
      `UPDATE rooms
       SET
         room_name = $1,
         room_type = $2,
         price = $3,
         description = $4,
         capacity = $5,
         image = $6,
         status = $7
       WHERE id = $8
       RETURNING id, room_name, room_type, price, description, capacity, image, status, created_at`,
      [
        room_name,
        room_type,
        price,
        description || null,
        capacity || 2,
        image || null,
        status || "available",
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    res.json({
      message: "Cập nhật phòng thành công",
      room: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================
// DELETE ROOM
// ======================
exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    // Chặn xóa phòng nếu đang có booking tham chiếu tới nó
    const bookingCheck = await pool.query(
      "SELECT id FROM bookings WHERE room_id = $1 LIMIT 1",
      [id]
    );

    if (bookingCheck.rows.length > 0) {
      return res.status(400).json({
        message:
          "Không thể xóa phòng này vì đã có booking liên quan. Hãy đổi trạng thái phòng thay vì xóa.",
      });
    }

    const result = await pool.query(
      "DELETE FROM rooms WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    res.json({
      message: "Xóa phòng thành công",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};