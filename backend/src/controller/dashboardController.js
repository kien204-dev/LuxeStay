const pool = require("../db/db.js");

exports.getDashboardStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM rooms)::int AS "totalRooms",
        (SELECT COUNT(*) FROM rooms WHERE status = 'available')::int AS "availableRooms",
        (SELECT COUNT(*) FROM rooms WHERE status = 'booked')::int AS "bookedRooms",
        (SELECT COUNT(*) FROM users)::int AS "totalUsers",
        (SELECT COUNT(*) FROM bookings)::int AS "totalBookings",
        COALESCE((
          SELECT SUM(total_price)
          FROM bookings
          WHERE status IN ('confirmed', 'completed')
        ), 0)::numeric AS "revenue"
    `);

    const stats = result.rows[0] || {};

    res.json({
      totalRooms: Number(stats.totalRooms) || 0,
      availableRooms: Number(stats.availableRooms) || 0,
      bookedRooms: Number(stats.bookedRooms) || 0,
      totalUsers: Number(stats.totalUsers) || 0,
      totalBookings: Number(stats.totalBookings) || 0,
      revenue: Number(stats.revenue) || 0,
    });
  } catch (err) {
    console.error("GET DASHBOARD STATS ERROR:", err);
    res.status(500).json({
      message: "Server error when loading dashboard stats",
    });
  }
};
