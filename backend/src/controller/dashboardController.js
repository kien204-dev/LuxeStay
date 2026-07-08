const pool = require("../db/db.js");

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const STATUS_COLORS = {
  confirmed: "#67e8b4",
  pending: "#fbbf24",
  completed: "#9fa7ff",
  cancelled: "#f87171",
};

function buildMonthlySeries(rows, valueKey, outputKey) {
  const series = MONTH_LABELS.map((month) => ({
    month,
    [outputKey]: 0,
  }));

  rows.forEach((row) => {
    const monthIndex = Number(row.month) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      series[monthIndex][outputKey] = Number(row[valueKey]) || 0;
    }
  });

  return series;
}

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

exports.getDashboardAnalytics = async (req, res) => {
  try {
    const [
      revenueByMonthResult,
      bookingsByMonthResult,
      bookingsByStatusResult,
      topRoomsResult,
      occupancyResult,
      recentBookingsResult,
    ] = await Promise.all([
      pool.query(`
        SELECT
          EXTRACT(MONTH FROM COALESCE(created_at::date, check_in))::int AS month,
          COALESCE(SUM(total_price), 0)::numeric AS revenue
        FROM bookings
        WHERE status IN ('confirmed', 'completed')
          AND EXTRACT(YEAR FROM COALESCE(created_at::date, check_in)) = EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY month
        ORDER BY month
      `),
      pool.query(`
        SELECT
          EXTRACT(MONTH FROM COALESCE(created_at::date, check_in))::int AS month,
          COUNT(*)::int AS bookings
        FROM bookings
        WHERE EXTRACT(YEAR FROM COALESCE(created_at::date, check_in)) = EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY month
        ORDER BY month
      `),
      pool.query(`
        SELECT status, COUNT(*)::int AS count
        FROM bookings
        GROUP BY status
        ORDER BY status
      `),
      pool.query(`
        SELECT
          r.id AS room_id,
          r.room_name,
          r.room_type,
          COUNT(b.id)::int AS booking_count,
          COALESCE(SUM(b.total_price) FILTER (WHERE b.status IN ('confirmed', 'completed')), 0)::numeric AS revenue
        FROM rooms r
        JOIN bookings b ON b.room_id = r.id
        GROUP BY r.id, r.room_name, r.room_type
        ORDER BY booking_count DESC, revenue DESC, r.room_name ASC
        LIMIT 5
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS "totalRooms",
          COUNT(*) FILTER (WHERE status = 'booked')::int AS "bookedRooms",
          COUNT(*) FILTER (WHERE status = 'available')::int AS "availableRooms",
          COUNT(*) FILTER (WHERE status = 'maintenance')::int AS "maintenanceRooms"
        FROM rooms
      `),
      pool.query(`
        SELECT
          b.id,
          b.check_in,
          b.check_out,
          b.total_price,
          b.status,
          b.created_at,
          u.name AS user_name,
          r.room_name
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN rooms r ON b.room_id = r.id
        ORDER BY b.id DESC
        LIMIT 5
      `),
    ]);

    const occupancy = occupancyResult.rows[0] || {};
    const totalRooms = Number(occupancy.totalRooms) || 0;
    const bookedRooms = Number(occupancy.bookedRooms) || 0;

    res.json({
      revenueByMonth: buildMonthlySeries(
        revenueByMonthResult.rows,
        "revenue",
        "revenue"
      ),
      bookingsByMonth: buildMonthlySeries(
        bookingsByMonthResult.rows,
        "bookings",
        "bookings"
      ),
      bookingsByStatus: bookingsByStatusResult.rows.map((row) => ({
        status: row.status || "pending",
        count: Number(row.count) || 0,
        color: STATUS_COLORS[row.status] || "#94a3b8",
      })),
      topRooms: topRoomsResult.rows.map((row) => ({
        room_id: Number(row.room_id),
        room_name: row.room_name,
        room_type: row.room_type,
        booking_count: Number(row.booking_count) || 0,
        revenue: Number(row.revenue) || 0,
      })),
      occupancy: {
        totalRooms,
        bookedRooms,
        availableRooms: Number(occupancy.availableRooms) || 0,
        maintenanceRooms: Number(occupancy.maintenanceRooms) || 0,
        occupancyRate: totalRooms ? Math.round((bookedRooms / totalRooms) * 100) : 0,
      },
      recentBookings: recentBookingsResult.rows,
    });
  } catch (err) {
    console.error("GET DASHBOARD ANALYTICS ERROR:", err);
    res.status(500).json({
      message: "Server error when loading dashboard analytics",
    });
  }
};
