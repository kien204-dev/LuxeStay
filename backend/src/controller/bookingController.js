const pool = require("../db/db.js");

const ACTIVE_STATUSES = ["pending", "confirmed"];
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDateOnly(dateStr) {
  if (typeof dateStr !== "string" || !DATE_ONLY_PATTERN.test(dateStr)) {
    return null;
  }

  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;

  const [year, month, day] = dateStr.split("-").map(Number);
  if (
    d.getFullYear() !== year ||
    d.getMonth() + 1 !== month ||
    d.getDate() !== day
  ) {
    return null;
  }

  return d;
}

function calculateNights(checkIn, checkOut) {
  const start = parseDateOnly(checkIn);
  const end = parseDateOnly(checkOut);
  if (!start || !end) return 0;
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

async function hasDateOverlap(client, roomId, checkIn, checkOut, excludeBookingId = null) {
  let query = `
    SELECT id FROM bookings
    WHERE room_id = $1
    AND status = ANY($4::text[])
    AND check_in < $3::date
    AND check_out > $2::date
  `;
  const params = [roomId, checkIn, checkOut, ACTIVE_STATUSES];

  if (excludeBookingId) {
    query += " AND id != $5";
    params.push(excludeBookingId);
  }

  query += " FOR UPDATE";

  const result = await client.query(query, params);
  return result.rows.length > 0;
}

async function syncRoomStatus(client, roomId) {
  const active = await client.query(
    `
    SELECT id FROM bookings
    WHERE room_id = $1
    AND status = ANY($2::text[])
    AND check_out >= CURRENT_DATE
    LIMIT 1
    `,
    [roomId, ACTIVE_STATUSES]
  );

  const room = await client.query(
    "SELECT status FROM rooms WHERE id = $1",
    [roomId]
  );

  if (room.rows.length === 0) return;

  if (room.rows[0].status === "maintenance") return;

  const newStatus = active.rows.length > 0 ? "booked" : "available";

  await client.query("UPDATE rooms SET status = $1 WHERE id = $2", [
    newStatus,
    roomId,
  ]);
}

const BOOKING_SELECT = `
  SELECT
    b.id,
    b.user_id,
    b.room_id,
    b.check_in,
    b.check_out,
    b.total_price,
    b.status,
    b.created_at,
    u.name AS user_name,
    u.email AS user_email,
    r.room_name,
    r.room_type,
    r.image AS room_image
  FROM bookings b
  JOIN users u ON b.user_id = u.id
  JOIN rooms r ON b.room_id = r.id
`;

exports.getBookings = async (req, res) => {
  try {
    let query = `${BOOKING_SELECT}`;
    const params = [];

    if (req.user.role !== "admin") {
      query += " WHERE b.user_id = $1";
      params.push(req.user.id);
    }

    query += " ORDER BY b.id DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("GET BOOKINGS ERROR:", err);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách booking" });
  }
};

exports.getBookingById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `${BOOKING_SELECT} WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    const booking = result.rows[0];

    if (req.user.role !== "admin" && booking.user_id !== req.user.id) {
      return res.status(403).json({
        message: "Bạn không có quyền xem booking này",
      });
    }

    res.json(booking);
  } catch (err) {
    console.error("GET BOOKING BY ID ERROR:", err);
    res.status(500).json({ message: "Lỗi server khi lấy booking" });
  }
};

exports.createBooking = async (req, res) => {
  const { room_id, check_in, check_out, guests, num_guests } = req.body;
  const user_id = req.user.id;
  const roomId = Number(room_id);
  const guestCount = Number(guests ?? num_guests ?? 1);

  if (!room_id || !check_in || !check_out) {
    return res.status(400).json({
      message: "Thiếu thông tin đặt phòng (room_id, check_in, check_out)",
    });
  }

  if (!Number.isInteger(roomId) || roomId <= 0) {
    return res.status(400).json({
      message: "Phong khong hop le",
    });
  }

  if (!Number.isInteger(guestCount) || guestCount <= 0) {
    return res.status(400).json({
      message: "So khach phai lon hon 0",
    });
  }

  const checkInDate = parseDateOnly(check_in);
  const checkOutDate = parseDateOnly(check_out);

  if (!checkInDate || !checkOutDate) {
    return res.status(400).json({ message: "Ngày check-in/check-out không hợp lệ" });
  }

  const nights = calculateNights(check_in, check_out);

  if (nights <= 0) {
    return res.status(400).json({
      message: "Ngày check-out phải sau ngày check-in",
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (checkInDate < today) {
    return res.status(400).json({
      message: "Ngày check-in không được ở quá khứ",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const roomResult = await client.query(
      "SELECT id, price, status, capacity FROM rooms WHERE id = $1 FOR UPDATE",
      [roomId]
    );

    if (roomResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    const room = roomResult.rows[0];
    const capacity = Number(room.capacity) || 0;
    const price = Number(room.price);

    if (capacity > 0 && guestCount > capacity) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: `So khach vuot qua suc chua cua phong (${capacity} khach)`,
      });
    }

    if (!Number.isFinite(price) || price < 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Gia phong khong hop le",
      });
    }

    if (room.status === "maintenance") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Phòng đang bảo trì, không thể đặt",
      });
    }

    const overlap = await hasDateOverlap(client, roomId, check_in, check_out);

    if (overlap) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Phòng đã có booking trùng khoảng thời gian này",
      });
    }

    const total_price = nights * price;

    const result = await client.query(
      `
      INSERT INTO bookings (user_id, room_id, check_in, check_out, total_price, status)
      VALUES ($1, $2, $3::date, $4::date, $5, 'pending')
      RETURNING *
      `,
      [user_id, roomId, check_in, check_out, total_price]
    );

    await syncRoomStatus(client, roomId);

    await client.query("COMMIT");

    res.status(201).json({
      message: "Đặt phòng thành công",
      booking: result.rows[0],
      total_price,
      nights,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("CREATE BOOKING ERROR:", err);
    res.status(500).json({ message: "Lỗi server khi tạo booking" });
  } finally {
    client.release();
  }
};

exports.updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowStatus = ["pending", "confirmed", "cancelled", "completed"];

  if (!allowStatus.includes(status)) {
    return res.status(400).json({ message: "Trạng thái booking không hợp lệ" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *
      `,
      [status, id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    const booking = result.rows[0];
    await syncRoomStatus(client, booking.room_id);

    await client.query("COMMIT");

    res.json({
      message: "Cập nhật trạng thái thành công",
      booking,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("UPDATE BOOKING ERROR:", err);
    res.status(500).json({ message: "Lỗi server" });
  } finally {
    client.release();
  }
};

exports.cancelBooking = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT * FROM bookings WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    const booking = existing.rows[0];

    if (req.user.role !== "admin" && booking.user_id !== req.user.id) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        message: "Bạn không có quyền hủy booking này",
      });
    }

    if (!["pending", "confirmed"].includes(booking.status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Chỉ có thể hủy booking đang pending hoặc confirmed",
      });
    }

    const result = await client.query(
      `
      UPDATE bookings SET status = 'cancelled' WHERE id = $1 RETURNING *
      `,
      [id]
    );

    await syncRoomStatus(client, booking.room_id);

    await client.query("COMMIT");

    res.json({
      message: "Hủy đặt phòng thành công",
      booking: result.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("CANCEL BOOKING ERROR:", err);
    res.status(500).json({ message: "Lỗi server khi hủy booking" });
  } finally {
    client.release();
  }
};

exports.deleteBooking = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const bookingCheck = await client.query(
      "SELECT * FROM bookings WHERE id = $1",
      [id]
    );

    if (bookingCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Không tìm thấy booking để xóa" });
    }

    const booking = bookingCheck.rows[0];

    const result = await client.query(
      "DELETE FROM bookings WHERE id = $1 RETURNING *",
      [id]
    );

    await syncRoomStatus(client, booking.room_id);

    await client.query("COMMIT");

    res.json({
      message: "Xóa booking thành công",
      booking: result.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("DELETE BOOKING ERROR:", err);
    res.status(500).json({ message: "Lỗi server khi xóa booking" });
  } finally {
    client.release();
  }
};
