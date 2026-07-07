
import { useEffect, useMemo, useState } from "react";
import {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from "../services/roomService";

const STATUS_OPTIONS = ["available", "booked", "maintenance"];

const statusStyle = {
  available: { color: "#67e8b4", bg: "rgba(103,232,180,0.12)" },
  booked: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  maintenance: { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const emptyForm = {
  room_name: "",
  room_type: "",
  price: "",
  capacity: 2,
  description: "",
  image: "",
  status: "available",
};

function formatMoney(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("vi-VN") + " đ";
}

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getRooms();
      setRooms(data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Không tải được danh sách phòng"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter(
      (r) =>
        r.room_name?.toLowerCase().includes(q) ||
        r.room_type?.toLowerCase().includes(q)
    );
  }, [rooms, search]);

  const openCreateModal = () => {
    setEditingRoom(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setForm({
      room_name: room.room_name || "",
      room_type: room.room_type || "",
      price: room.price ?? "",
      capacity: room.capacity ?? 2,
      description: room.description || "",
      image: room.image || "",
      status: room.status || "available",
    });
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.room_name.trim() || !form.room_type.trim()) {
      setFormError("Vui lòng nhập tên phòng và loại phòng");
      return;
    }

    if (form.price === "" || Number(form.price) < 0) {
      setFormError("Giá phòng không hợp lệ");
      return;
    }

    const payload = {
      ...form,
      price: Number(form.price),
      capacity: Number(form.capacity) || 2,
    };

    try {
      setSaving(true);

      if (editingRoom) {
        const res = await updateRoom(editingRoom.id, payload);
        setRooms((list) =>
          list.map((r) => (r.id === editingRoom.id ? res.room : r))
        );
      } else {
        const res = await createRoom(payload);
        setRooms((list) => [...list, res.room]);
      }

      setShowModal(false);
    } catch (err) {
      setFormError(
        err.response?.data?.message || "Lưu phòng thất bại, vui lòng thử lại"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (room) => {
    if (
      !window.confirm(`Bạn có chắc muốn xóa phòng "${room.room_name}"?`)
    )
      return;

    setDeletingId(room.id);
    setError("");
    try {
      await deleteRoom(room.id);
      setRooms((list) => list.filter((r) => r.id !== room.id));
    } catch (err) {
      setError(err.response?.data?.message || "Xoa phong that bai");
      alert(err.response?.data?.message || "Xóa phòng thất bại");
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
            Rooms
          </h1>
          <p style={{ color: "#7b849e", marginTop: 8 }}>
            Quản lý danh sách phòng, giá và trạng thái.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", width: "min(100%, 520px)" }}>
          <input
            type="text"
            placeholder="Tìm theo tên hoặc loại phòng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "#192540",
              border: "1px solid rgba(64,72,93,0.4)",
              borderRadius: 10,
              padding: "10px 14px",
              color: "#dee5ff",
              fontSize: 14,
              minWidth: 0,
              flex: "1 1 220px",
            }}
          />

          <button
            onClick={openCreateModal}
            style={{
              background: "#9fa7ff",
              color: "#060e20",
              border: "none",
              borderRadius: 10,
              padding: "10px 16px",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flex: "0 0 auto",
            }}
          >
            + Thêm phòng
          </button>
        </div>
      </header>

      <div
        style={{
          background: "rgba(25,37,64,0.6)",
          border: "1px solid rgba(64,72,93,0.3)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {error && (
          <div style={{ padding: "16px 22px", color: "#f87171", fontSize: 14 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: "40px 22px", textAlign: "center", color: "#7b849e" }}>
            Đang tải danh sách phòng...
          </div>
        ) : filteredRooms.length === 0 ? (
          <div style={{ padding: "40px 22px", textAlign: "center", color: "#7b849e" }}>
            Không có phòng nào.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {[
                    "Phòng",
                    "Loại",
                    "Giá / đêm",
                    "Sức chứa",
                    "Trạng thái",
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
                {filteredRooms.map((room) => {
                  const style = statusStyle[room.status] || statusStyle.available;
                  return (
                    <tr key={room.id}>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {room.image ? (
                            <img
                              src={room.image}
                              alt={room.room_name}
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: 10,
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: 10,
                                background: "rgba(159,167,255,0.12)",
                              }}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: 600 }}>{room.room_name}</div>
                            <div style={{ color: "#7b849e", fontSize: 12 }}>
                              #{room.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>{room.room_type}</td>
                      <td style={tdStyle}>{formatMoney(room.price)}</td>
                      <td style={tdStyle}>{room.capacity} khách</td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            padding: "5px 12px",
                            borderRadius: 20,
                            color: style.color,
                            background: style.bg,
                            fontSize: 12,
                            fontWeight: 700,
                            textTransform: "capitalize",
                          }}
                        >
                          {room.status}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => openEditModal(room)}
                            style={{
                              background: "rgba(159,167,255,0.12)",
                              color: "#9fa7ff",
                              border: "1px solid rgba(159,167,255,0.3)",
                              borderRadius: 8,
                              padding: "6px 12px",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(room)}
                            disabled={deletingId === room.id}
                            style={{
                              background: "rgba(248,113,113,0.12)",
                              color: "#f87171",
                              border: "1px solid rgba(248,113,113,0.3)",
                              borderRadius: 8,
                              padding: "6px 12px",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor:
                                deletingId === room.id ? "not-allowed" : "pointer",
                            }}
                          >
                            {deletingId === room.id ? "..." : "Xóa"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#192540",
              border: "1px solid rgba(64,72,93,0.4)",
              borderRadius: 16,
              padding: 28,
              width: "100%",
              maxWidth: 480,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2 style={{ margin: "0 0 20px", color: "#fff", fontSize: 20 }}>
              {editingRoom ? "Sửa phòng" : "Thêm phòng mới"}
            </h2>

            <form onSubmit={handleSubmit}>
              <Field label="Tên phòng">
                <input
                  name="room_name"
                  value={form.room_name}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Deluxe Suite 401"
                />
              </Field>

              <Field label="Loại phòng">
                <input
                  name="room_type"
                  value={form.room_type}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Deluxe / Standard / Suite..."
                />
              </Field>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <Field label="Giá / đêm (VNĐ)">
                    <input
                      type="number"
                      min="0"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      style={inputStyle}
                      placeholder="1500000"
                    />
                  </Field>
                </div>
                <div style={{ flex: 1 }}>
                  <Field label="Sức chứa (khách)">
                    <input
                      type="number"
                      min="1"
                      name="capacity"
                      value={form.capacity}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </Field>
                </div>
              </div>

              <Field label="Ảnh (URL)">
                <input
                  name="image"
                  value={form.image}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="https://..."
                />
              </Field>

              <Field label="Mô tả">
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </Field>

              <Field label="Trạng thái">
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>

              {formError && (
                <p style={{ color: "#f87171", fontSize: 13, marginTop: 4 }}>
                  {formError}
                </p>
              )}

              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 10,
                    border: "1px solid rgba(64,72,93,0.4)",
                    background: "transparent",
                    color: "#a3aac4",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 10,
                    border: "none",
                    background: "#9fa7ff",
                    color: "#060e20",
                    fontWeight: 700,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", color: "#a3aac4", fontSize: 13, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const tdStyle = {
  padding: "16px 18px",
  borderBottom: "1px solid rgba(64,72,93,0.18)",
  color: "#dee5ff",
  fontSize: 14,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  background: "#0f1117",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#fff",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};
