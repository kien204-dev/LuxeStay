import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBookings, cancelBooking } from "../services/bookingService";
import { normalizeImageUrl, useFallbackImage } from "../utils/imageUrl";

const STATUS_STYLE = {
  confirmed: { color: "#67e8b4", bg: "rgba(103,232,180,0.12)" },
  pending: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  cancelled: { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  completed: { color: "#9fa7ff", bg: "rgba(159,167,255,0.12)" },
};

const STATUS_LABEL = {
  confirmed: "Đã xác nhận",
  pending: "Chờ xác nhận",
  cancelled: "Đã hủy",
  completed: "Hoàn tất",
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

function calculateNights(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

function buildTimeline(booking) {
  const status = booking.status || "pending";
  const items = [
    {
      label: "Đã tạo yêu cầu đặt phòng",
      date: booking.created_at,
      active: true,
    },
  ];

  if (status === "cancelled") {
    items.push({
      label: "Đã hủy",
      date: null,
      active: true,
      note: "Thời điểm hủy chính xác chưa có trong dữ liệu hiện tại.",
    });
  } else {
    items.push({
      label: status === "pending" ? "Chờ xác nhận" : "Đã xác nhận",
      date: status === "pending" ? null : booking.created_at,
      active: ["pending", "confirmed", "completed"].includes(status),
    });

    items.push({
      label: "Check-in",
      date: booking.check_in,
      active: ["confirmed", "completed"].includes(status),
    });

    items.push({
      label: status === "completed" ? "Check-out / Hoàn tất" : "Check-out",
      date: booking.check_out,
      active: status === "completed",
    });
  }

  return items;
}

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

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
      setSelectedBooking((booking) =>
        booking?.id === id ? { ...booking, status: "cancelled" } : booking
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
      <style>{`
        @media (max-width: 720px) {
          .my-bookings-header {
            align-items: flex-start !important;
            flex-direction: column !important;
            padding: 14px 18px !important;
          }
          .my-booking-card {
            grid-template-columns: 1fr !important;
          }
          .my-booking-image {
            min-height: 180px !important;
          }
          .my-booking-actions {
            align-items: flex-start !important;
            padding-top: 0 !important;
          }
          .booking-detail-panel {
            max-height: 92vh !important;
            overflow-y: auto !important;
          }
          .booking-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <header
        className="my-bookings-header"
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
                  className="my-booking-card"
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
                    className="my-booking-image"
                    style={{
                      minHeight: 120,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={normalizeImageUrl(b.room_image)}
                      alt={b.room_name || "Room"}
                      onError={useFallbackImage}
                      style={{
                        width: "100%",
                        height: "100%",
                        minHeight: 120,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
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
                    className="my-booking-actions"
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
                    <button
                      onClick={() => setSelectedBooking(b)}
                      style={{
                        padding: "8px 14px",
                        background: "#002366",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      Chi tiết
                    </button>
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

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}

function BookingDetailModal({ booking, onClose }) {
  const style = STATUS_STYLE[booking.status] || STATUS_STYLE.pending;
  const nights = calculateNights(booking.check_in, booking.check_out);
  const timeline = buildTimeline(booking);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.65)",
        zIndex: 3000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        className="booking-detail-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 920,
          background: "#fff",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(15,23,42,0.35)",
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div>
            <p style={{ margin: "0 0 4px", color: "#64748b", fontSize: 12 }}>
              Booking ID #{String(booking.id).padStart(4, "0")}
            </p>
            <h2 style={{ margin: 0, color: "#002366", fontSize: 22 }}>
              Chi tiết đặt phòng
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "1px solid #e2e8f0",
              background: "#fff",
              cursor: "pointer",
              fontSize: 20,
              color: "#334155",
            }}
          >
            ×
          </button>
        </div>

        <div
          className="booking-detail-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: 0,
          }}
        >
          <div
            style={{
              minHeight: 280,
              overflow: "hidden",
            }}
          >
            <img
              src={normalizeImageUrl(booking.room_image)}
              alt={booking.room_name || "Room"}
              onError={useFallbackImage}
              style={{
                width: "100%",
                height: "100%",
                minHeight: 280,
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>

          <div style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: "0 0 6px", color: "#002366", fontSize: 20 }}>
                  {booking.room_name || "-"}
                </h3>
                <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
                  {booking.room_type || "-"}
                </p>
              </div>
              <span
                style={{
                  alignSelf: "flex-start",
                  padding: "5px 12px",
                  borderRadius: 20,
                  color: style.color,
                  background: style.bg,
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {STATUS_LABEL[booking.status] || booking.status || "pending"}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <DetailItem label="Check-in" value={formatDate(booking.check_in)} />
              <DetailItem label="Check-out" value={formatDate(booking.check_out)} />
              <DetailItem label="Số đêm" value={`${nights} đêm`} />
              <DetailItem label="Ngày tạo" value={formatDate(booking.created_at)} />
              <DetailItem label="Tổng tiền" value={formatMoney(booking.total_price)} highlight />
              <DetailItem label="Trạng thái" value={STATUS_LABEL[booking.status] || booking.status || "-"} />
            </div>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ margin: "0 0 4px", color: "#002366", fontSize: 16 }}>
                  Timeline trạng thái
                </h3>
                <p style={{ margin: 0, color: "#64748b", fontSize: 12, lineHeight: 1.5 }}>
                  Timeline này được suy luận từ trạng thái hiện tại, ngày tạo và ngày lưu trú; chưa phải log lịch sử chi tiết.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {timeline.map((item, index) => (
                  <div key={`${item.label}-${index}`} style={{ display: "flex", gap: 12 }}>
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: item.active ? "#002366" : "#cbd5e1",
                        marginTop: 4,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <p style={{ margin: 0, color: item.active ? "#1e293b" : "#94a3b8", fontWeight: 700, fontSize: 13 }}>
                        {item.label}
                      </p>
                      <p style={{ margin: "3px 0 0", color: "#64748b", fontSize: 12 }}>
                        {item.date ? formatDate(item.date) : "Theo trạng thái hiện tại"}
                      </p>
                      {item.note && (
                        <p style={{ margin: "3px 0 0", color: "#94a3b8", fontSize: 12 }}>
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, highlight = false }) {
  return (
    <div
      style={{
        background: highlight ? "#fffbeb" : "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "12px 14px",
      }}
    >
      <p style={{ margin: "0 0 5px", color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </p>
      <p style={{ margin: 0, color: highlight ? "#C5A059" : "#1e293b", fontWeight: 800, fontSize: 14 }}>
        {value}
      </p>
    </div>
  );
}
