import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBookings, cancelBooking } from "../services/bookingService";

const STATUS_STYLE = {
  confirmed: { color: "#67e8b4", bg: "rgba(103,232,180,0.12)" },
  pending: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  cancelled: { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  completed: { color: "#9fa7ff", bg: "rgba(159,167,255,0.12)" },
};

function formatMoney(value) {
  return (Number(value) || 0).toLocaleString("vi-VN") + " đ";
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("vi-VN");
}

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getBookings();
      setBookings(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Không tải được danh sách đặt phòng"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy đặt phòng này?")) return;

    setCancellingId(id);
    try {
      await cancelBooking(id);
      setBookings((list) =>
        list.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Hủy đặt phòng thất bại");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div
      className="font-body"
      style={{ minHeight: "100vh", background: "#fafafa", color: "#1A1C1E" }}
    >
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => navigate("/booking")}
            style={{
              background: "transparent",
              border: "none",
              color: "#002366",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ← Quay lại
          </button>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              color: "#002366",
              fontFamily: "Noto Serif, serif",
            }}
          >
            Đặt phòng của tôi
          </h1>
        </div>
        <button
          onClick={loadBookings}
          disabled={loading}
          style={{
            padding: "8px 16px",
            background: "#002366",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 13,
          }}
        >
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              padding: 16,
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: "center", color: "#64748b" }}>Đang tải...</p>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ color: "#64748b", marginBottom: 20 }}>
              Bạn chưa có đặt phòng nào.
            </p>
            <button
              onClick={() => navigate("/booking")}
              style={{
                padding: "12px 24px",
                background: "#002366",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Khám phá phòng
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {bookings.map((b) => {
              const style = STATUS_STYLE[b.status] || STATUS_STYLE.pending;
              const canCancel = ["pending", "confirmed"].includes(b.status);

              return (
                <div
                  key={b.id}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                    display: "grid",
                    gridTemplateColumns: "140px 1fr auto",
                    gap: 0,
                  }}
                >
                  <div
                    style={{
                      backgroundImage: b.room_image
                        ? `url(${b.room_image})`
                        : "linear-gradient(135deg,#002366,#004080)",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      minHeight: 120,
                    }}
                  />
                  <div style={{ padding: "20px 24px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "capitalize",
                          color: style.color,
                          background: style.bg,
                        }}
                      >
                        {b.status}
                      </span>
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>
                        #{String(b.id).padStart(4, "0")}
                      </span>
                    </div>
                    <h3
                      style={{
                        margin: "0 0 6px",
                        color: "#002366",
                        fontSize: 18,
                      }}
                    >
                      {b.room_name}
                    </h3>
                    <p style={{ margin: "0 0 8px", color: "#64748b", fontSize: 13 }}>
                      {b.room_type}
                    </p>
                    <p style={{ margin: 0, color: "#475569", fontSize: 14 }}>
                      {formatDate(b.check_in)} → {formatDate(b.check_out)}
                    </p>
                  </div>
                  <div
                    style={{
                      padding: "20px 24px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      gap: 10,
                    }}
                  >
                    <strong style={{ color: "#C5A059", fontSize: 18 }}>
                      {formatMoney(b.total_price)}
                    </strong>
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        disabled={cancellingId === b.id}
                        style={{
                          padding: "8px 14px",
                          background: "transparent",
                          color: "#dc2626",
                          border: "1px solid #fecaca",
                          borderRadius: 6,
                          cursor:
                            cancellingId === b.id ? "not-allowed" : "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {cancellingId === b.id ? "Đang hủy..." : "Hủy đặt phòng"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
