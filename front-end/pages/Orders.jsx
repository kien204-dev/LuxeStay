import { useEffect, useMemo, useState } from "react";
import {
  getBookings,
  updateBooking,
  deleteBooking,
} from "../services/bookingService";

const STATUS_OPTIONS = ["pending", "confirmed", "cancelled", "completed"];

const statusStyle = {
  confirmed: { color: "#67e8b4", bg: "rgba(103,232,180,0.12)" },
  pending: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  cancelled: { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  completed: { color: "#9fa7ff", bg: "rgba(159,167,255,0.12)" },
};

function formatMoney(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("vi-VN") + " đ";
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("vi-VN");
}

function Orders() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getBookings();
      setBookings(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Không tải được danh sách đơn đặt phòng"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const cards = useMemo(() => {
    const revenue = bookings
      .filter((b) => b.status === "confirmed" || b.status === "completed")
      .reduce((sum, b) => sum + Number(b.total_price || 0), 0);

    const pending = bookings.filter((b) => b.status === "pending").length;

    return [
      { label: "Revenue", value: formatMoney(revenue) },
      { label: "Pending", value: pending },
      { label: "Orders", value: bookings.length },
    ];
  }, [bookings]);

  const handleStatusChange = async (id, newStatus) => {
    const prev = bookings;
    setUpdatingId(id);
    setBookings((list) =>
      list.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );

    try {
      await updateBooking(id, newStatus);
    } catch (err) {
      setBookings(prev);
      alert(
        err.response?.data?.message ||
          "Cập nhật trạng thái thất bại, vui lòng thử lại"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa đơn đặt phòng này?")) return;

    setDeletingId(id);
    try {
      await deleteBooking(id);
      setBookings((list) => list.filter((b) => b.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Xóa đơn đặt phòng thất bại");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <header
        style={{
          marginBottom: 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: "#fff" }}>
            Active Orders
          </h1>
          <p style={{ color: "#7b849e", marginTop: 8 }}>
            Manage hotel bookings and customer orders.
          </p>
        </div>
        <button
          onClick={loadBookings}
          disabled={loading}
          style={{
            background: "rgba(159,167,255,0.12)",
            color: "#9fa7ff",
            border: "1px solid rgba(159,167,255,0.3)",
            borderRadius: 10,
            padding: "10px 16px",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Đang tải..." : "↻ Làm mới"}
        </button>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 20,
          marginBottom: 28,
        }}
      >
        {cards.map((card) => (
          <div
            key={card.label}
            style={{
              background: "rgba(25,37,64,0.6)",
              border: "1px solid rgba(64,72,93,0.3)",
              borderRadius: 16,
              padding: 24,
            }}
          >
            <p style={{ color: "#a3aac4", margin: 0, fontSize: 14 }}>
              {card.label}
            </p>
            <h2 style={{ color: "#fff", fontSize: 28, margin: "10px 0 0" }}>
              {card.value}
            </h2>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "rgba(25,37,64,0.6)",
          border: "1px solid rgba(64,72,93,0.3)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid rgba(64,72,93,0.3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>Order List</h2>
        </div>

        {error && (
          <div style={{ padding: "16px 22px", color: "#f87171", fontSize: 14 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: "40px 22px", textAlign: "center", color: "#7b849e" }}>
            Đang tải danh sách đơn đặt phòng...
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ padding: "40px 22px", textAlign: "center", color: "#7b849e" }}>
            Chưa có đơn đặt phòng nào.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {[
                    "Order ID",
                    "Customer",
                    "Room",
                    "Check-in",
                    "Check-out",
                    "Status",
                    "Amount",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "14px 18px",
                        textAlign: "left",
                        color: "#7b849e",
                        fontSize: 12,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        borderBottom: "1px solid rgba(64,72,93,0.3)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {bookings.map((order) => {
                  const style = statusStyle[order.status] || statusStyle.pending;
                  return (
                    <tr key={order.id}>
                      <td style={tdStyle}>#BK-{String(order.id).padStart(4, "0")}</td>
                      <td style={tdStyle}>
                        <div>{order.user_name}</div>
                        <div style={{ color: "#7b849e", fontSize: 12 }}>
                          {order.user_email}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div>{order.room_name}</div>
                        <div style={{ color: "#7b849e", fontSize: 12 }}>
                          {order.room_type}
                        </div>
                      </td>
                      <td style={tdStyle}>{formatDate(order.check_in)}</td>
                      <td style={tdStyle}>{formatDate(order.check_out)}</td>
                      <td style={tdStyle}>
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value)
                          }
                          style={{
                            padding: "5px 10px",
                            borderRadius: 20,
                            color: style.color,
                            background: style.bg,
                            fontSize: 12,
                            fontWeight: 700,
                            border: "none",
                            textTransform: "capitalize",
                            cursor: "pointer",
                          }}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option
                              key={s}
                              value={s}
                              style={{ color: "#000", textTransform: "capitalize" }}
                            >
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={tdStyle}>{formatMoney(order.total_price)}</td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleDelete(order.id)}
                          disabled={deletingId === order.id}
                          style={{
                            background: "rgba(248,113,113,0.12)",
                            color: "#f87171",
                            border: "1px solid rgba(248,113,113,0.3)",
                            borderRadius: 8,
                            padding: "6px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor:
                              deletingId === order.id ? "not-allowed" : "pointer",
                          }}
                        >
                          {deletingId === order.id ? "..." : "Xóa"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const tdStyle = {
  padding: "16px 18px",
  borderBottom: "1px solid rgba(64,72,93,0.18)",
  color: "#dee5ff",
  fontSize: 14,
};

export default Orders;
