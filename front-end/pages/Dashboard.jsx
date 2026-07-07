import { useEffect, useMemo, useState } from "react";
import Icon from "../utils/icon";
import RevenueChart from "../layout/components/chart/RevenueChart";
import OccupancyChart from "../layout/components/chart/OccupancyChart";
import BookingStatusChart from "../layout/components/chart/BookingStatusChart";
import { getDashboardStats } from "../services/dashboardService";
import { getBookings } from "../services/bookingService";

const DEFAULT_STATS = {
  totalRooms: 0,
  availableRooms: 0,
  bookedRooms: 0,
  totalUsers: 0,
  totalBookings: 0,
  revenue: 0,
};

const STATUS_COLORS = {
  confirmed: "#67e8b4",
  pending: "#fbbf24",
  completed: "#9fa7ff",
  cancelled: "#f87171",
};

const statusStyle = {
  confirmed: { bg: "rgba(103,232,180,0.12)", color: "#67e8b4", label: "Confirmed" },
  pending: { bg: "rgba(251,191,36,0.12)", color: "#fbbf24", label: "Pending" },
  completed: { bg: "rgba(159,167,255,0.12)", color: "#9fa7ff", label: "Completed" },
  cancelled: { bg: "rgba(248,113,113,0.12)", color: "#f87171", label: "Cancelled" },
};

function normalizeStats(stats) {
  return {
    totalRooms: Number(stats?.totalRooms) || 0,
    availableRooms: Number(stats?.availableRooms) || 0,
    bookedRooms: Number(stats?.bookedRooms) || 0,
    totalUsers: Number(stats?.totalUsers) || 0,
    totalBookings: Number(stats?.totalBookings) || 0,
    revenue: Number(stats?.revenue) || 0,
  };
}

function formatMoney(value) {
  return `${(Number(value) || 0).toLocaleString("vi-VN")} VND`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
}

function buildBookingStatusData(bookings) {
  const counts = bookings.reduce((acc, booking) => {
    const status = booking.status || "pending";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    color: STATUS_COLORS[name] || "#94a3b8",
  }));
}

function buildRevenueData(bookings) {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), index, 1);
    return {
      month: date.toLocaleString("en-US", { month: "short" }),
      revenue: 0,
    };
  });

  bookings
    .filter((booking) => ["confirmed", "completed"].includes(booking.status))
    .forEach((booking) => {
      const date = new Date(booking.created_at || booking.check_in);
      if (Number.isNaN(date.getTime()) || date.getFullYear() !== now.getFullYear()) return;
      months[date.getMonth()].revenue += Number(booking.total_price) || 0;
    });

  return months;
}

function StatCard({ label, value, note, icon, color }) {
  const IconComp = Icon[icon];

  return (
    <div style={{
      background: "rgba(25,37,64,0.6)",
      border: "1px solid rgba(64,72,93,0.3)",
      borderRadius: 16,
      padding: "20px 24px",
      backdropFilter: "blur(16px)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        top: -20,
        right: -20,
        width: 90,
        height: 90,
        background: color,
        borderRadius: "50%",
        opacity: 0.07,
        filter: "blur(20px)",
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ color: "#a3aac4", fontSize: 11, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</p>
          <p style={{ color: "#dee5ff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>{value}</p>
        </div>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${color}1a`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
        }}>
          {IconComp && <IconComp />}
        </div>
      </div>

      <div style={{ marginTop: 12, color: "#5a6480", fontSize: 12 }}>
        {note}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsData, bookingsResponse] = await Promise.all([
        getDashboardStats(),
        getBookings(),
      ]);

      setStats(normalizeStats(statsData));
      setBookings(Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Cannot load dashboard data");
      setStats(DEFAULT_STATS);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const occupancyRate = stats.totalRooms
    ? Math.round((stats.bookedRooms / stats.totalRooms) * 100)
    : 0;

  const statCards = [
    {
      label: "Total Rooms",
      value: stats.totalRooms.toLocaleString(),
      note: "All rooms in PostgreSQL",
      icon: "Rooms",
      color: "#9fa7ff",
    },
    {
      label: "Available Rooms",
      value: stats.availableRooms.toLocaleString(),
      note: "Rooms with available status",
      icon: "Hotel",
      color: "#67e8b4",
    },
    {
      label: "Booked Rooms",
      value: stats.bookedRooms.toLocaleString(),
      note: "Rooms with booked status",
      icon: "Booking",
      color: "#fbbf24",
    },
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      note: "Registered accounts",
      icon: "Users",
      color: "#f9a8d4",
    },
    {
      label: "Total Booking",
      value: stats.totalBookings.toLocaleString(),
      note: "All booking records",
      icon: "Orders",
      color: "#60a5fa",
    },
    {
      label: "Revenue",
      value: formatMoney(stats.revenue),
      note: "Confirmed and completed bookings",
      icon: "Revenue",
      color: "#c084fc",
    },
  ];

  const bookingStatusData = useMemo(() => buildBookingStatusData(bookings), [bookings]);
  const revenueData = useMemo(() => buildRevenueData(bookings), [bookings]);
  const occupancyData = useMemo(
    () => [{ month: "Current", value: occupancyRate }],
    [occupancyRate]
  );
  const recentBookings = useMemo(() => bookings.slice(0, 5), [bookings]);

  return (
    <div style={{
      background: "#060e20",
      minHeight: "100vh",
      color: "#dee5ff",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      display: "flex",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 500, height: 500, background: "#9fa7ff", borderRadius: "50%", filter: "blur(100px)", opacity: 0.12 }} />
        <div style={{ position: "absolute", bottom: "-15%", right: "-5%", width: 600, height: 600, background: "#62259b", borderRadius: "50%", filter: "blur(100px)", opacity: 0.12 }} />
      </div>

      <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#dee5ff", margin: 0, letterSpacing: "-0.02em" }}>Admin Dashboard</h1>
            <p style={{ color: "#5a6480", fontSize: 13, margin: "4px 0 0" }}>
              Live hotel operations overview
            </p>
          </div>

          <button
            onClick={loadDashboard}
            disabled={loading}
            style={{
              padding: "8px 20px",
              borderRadius: 20,
              background: "linear-gradient(135deg,#9fa7ff,#8a95ff)",
              border: "none",
              color: "#060e20",
              fontWeight: 700,
              fontSize: 13,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div style={{
            marginBottom: 20,
            padding: "14px 16px",
            borderRadius: 12,
            color: "#f87171",
            background: "rgba(248,113,113,0.12)",
            border: "1px solid rgba(248,113,113,0.25)",
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#a3aac4" }}>
            Loading dashboard data...
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
              {statCards.map((card) => (
                <StatCard key={card.label} {...card} />
              ))}
            </div>

            <div style={{
              background: "rgba(25,37,64,0.6)",
              border: "1px solid rgba(64,72,93,0.3)",
              borderRadius: 16,
              padding: "24px 28px",
              backdropFilter: "blur(16px)",
              marginBottom: 24,
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 20,
              }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#dee5ff" }}>
                    Room Occupancy
                  </h2>
                  <p style={{ margin: "4px 0 0", color: "#5a6480", fontSize: 12 }}>
                    Current booked room ratio
                  </p>
                </div>
                <span style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  background: "rgba(103,232,180,0.12)",
                  color: "#67e8b4",
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  {occupancyRate}%
                </span>
              </div>

              <div style={{ height: 240 }}>
                <OccupancyChart data={occupancyData} />
              </div>
            </div>

            <div style={{
              background: "rgba(25,37,64,0.6)",
              border: "1px solid rgba(64,72,93,0.3)",
              borderRadius: 16,
              padding: 24,
              backdropFilter: "blur(16px)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#dee5ff" }}>Recent Bookings</h2>
              </div>

              {recentBookings.length === 0 ? (
                <div style={{ padding: "28px 12px", textAlign: "center", color: "#5a6480" }}>
                  No bookings found.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Booking ID", "Guest", "Room", "Check-in", "Check-out", "Status", "Amount"].map((header) => (
                          <th key={header} style={{
                            padding: "8px 12px",
                            textAlign: "left",
                            fontSize: 11,
                            color: "#5a6480",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            borderBottom: "1px solid rgba(64,72,93,0.3)",
                          }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.map((booking) => {
                        const style = statusStyle[booking.status] || statusStyle.pending;

                        return (
                          <tr key={booking.id} style={{ borderBottom: "1px solid rgba(64,72,93,0.15)" }}>
                            <td style={{ padding: "12px", fontSize: 13, color: "#9fa7ff", fontWeight: 600 }}>
                              #BK-{String(booking.id).padStart(4, "0")}
                            </td>
                            <td style={{ padding: "12px", fontSize: 13, color: "#dee5ff" }}>{booking.user_name || "-"}</td>
                            <td style={{ padding: "12px", fontSize: 13, color: "#a3aac4" }}>{booking.room_name || "-"}</td>
                            <td style={{ padding: "12px", fontSize: 13, color: "#a3aac4" }}>{formatDate(booking.check_in)}</td>
                            <td style={{ padding: "12px", fontSize: 13, color: "#a3aac4" }}>{formatDate(booking.check_out)}</td>
                            <td style={{ padding: "12px" }}>
                              <span style={{ padding: "3px 10px", borderRadius: 20, background: style.bg, color: style.color, fontSize: 11, fontWeight: 600 }}>
                                {style.label}
                              </span>
                            </td>
                            <td style={{ padding: "12px", fontSize: 13, color: "#dee5ff", fontWeight: 600 }}>
                              {formatMoney(booking.total_price)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{
              marginTop: 24,
              background: "rgba(25,37,64,0.6)",
              border: "1px solid rgba(64,72,93,0.3)",
              borderRadius: 16,
              padding: 24,
            }}>
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#dee5ff" }}>
                  Revenue Overview
                </h3>
              </div>
              <RevenueChart data={revenueData} />
            </div>

            <div style={{
              marginTop: 20,
              background: "rgba(25,37,64,0.6)",
              border: "1px solid rgba(64,72,93,0.3)",
              borderRadius: 16,
              padding: 20,
            }}>
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#dee5ff" }}>
                  Booking Status
                </h3>
              </div>

              {bookingStatusData.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#5a6480" }}>
                  No booking status data.
                </div>
              ) : (
                <>
                  <BookingStatusChart data={bookingStatusData} />
                  <div style={{ marginTop: 10 }}>
                    {bookingStatusData.map((item) => (
                      <div key={item.name} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                        fontSize: 13,
                        color: "#a3aac4",
                      }}>
                        <span>
                          <span style={{
                            display: "inline-block",
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: item.color,
                            marginRight: 6,
                          }} />
                          {item.name}
                        </span>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
