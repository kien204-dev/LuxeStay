import React, { useEffect, useMemo, useState } from "react";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from "../services/userService";

const colors = [
  "linear-gradient(135deg,#6c63ff,#4f46e5)",
  "linear-gradient(135deg,#2dd4bf,#0d9488)",
  "linear-gradient(135deg,#fbbf24,#f97316)",
  "linear-gradient(135deg,#c084fc,#ec4899)",
];

const inputStyle = {
  width: "100%",
  marginBottom: 10,
  padding: "10px 12px",
  background: "#0f1117",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#fff",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

function buildUserRow(u) {
  const isOnline = Math.random() > 0.5;

  return {
    id: u.id,
    name: u.name ?? "Unknown",
    initials: (u.name ?? "?")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    avatarBg: colors[Math.floor(Math.random() * colors.length)],
    roleValue: u.role ?? "user",
    role: {
      label: u.role ?? "user",
      bg:
        u.role === "admin"
          ? "rgba(239,68,68,0.15)"
          : "rgba(59,130,246,0.15)",
      color: u.role === "admin" ? "#f87171" : "#60a5fa",
      border:
        u.role === "admin"
          ? "rgba(239,68,68,0.3)"
          : "rgba(59,130,246,0.3)",
    },
    contactLines: [u.email ?? "—", "—"],
    status: isOnline
      ? { dot: "#4ade80", label: "Online", color: "#4ade80" }
      : { dot: "#f87171", label: "Offline", color: "#f87171" },
    joined: u.created_at
      ? new Date(u.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—",
  };
}

export default function Users() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [modalError, setModalError] = useState("");
  const [editError, setEditError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "123456",
    role: "user",
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const getPageNumbers = (current, total) => {
    if (total <= 1) return [1];

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = [1];

    if (current > 3) {
      pages.push("...");
    }

    for (
      let i = Math.max(2, current - 1);
      i <= Math.min(total - 1, current + 1);
      i++
    ) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push("...");
    }

    pages.push(total);
    return pages;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setPageError("");

      const data = await getUsers();
      const rows = data.map((u) => buildUserRow(u));

      setUsers(rows);
    } catch (err) {
      setPageError(err.response?.data?.message || "Khong tai duoc danh sach user");
      if (err.response?.status === 401) {
        alert("Bạn chưa đăng nhập hoặc token đã hết hạn");
      } else if (err.response?.status === 403) {
        alert("Bạn không có quyền truy cập trang quản lý user");
      } else {
        alert(err.response?.data?.message || "Lỗi khi tải danh sách user");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    setModalError("");

    if (!form.name || !form.email) {
      setModalError("Nhap thieu ten hoac email");
      alert("Nhập thiếu tên hoặc email!");
      return;
    }

    try {
      setSubmitting(true);

      const res = await createUser({
        name: form.name,
        email: form.email,
        password: form.password || "123456",
        role: form.role || "user",
      });

      const newUser = buildUserRow(res.user);

      setUsers((prev) => [newUser, ...prev]);
      setShowModal(false);
      setForm({
        name: "",
        email: "",
        password: "123456",
        role: "user",
      });
    } catch (err) {
      setModalError(err.response?.data?.message || "Loi khi them user");
      alert(err.response?.data?.message || "Lỗi khi thêm user!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    setEditError("");

    if (!editUser?.name || !editUser?.email) {
      setEditError("Nhap thieu ten hoac email");
      alert("Nhập thiếu tên hoặc email!");
      return;
    }

    try {
      setSubmitting(true);

      const res = await updateUser(editUser.id, {
        name: editUser.name,
        email: editUser.email,
        role: editUser.roleValue || "user",
      });

      const updatedUser = buildUserRow(res.user);

      setUsers((prev) =>
        prev.map((item) => (item.id === editUser.id ? updatedUser : item))
      );

      setShowEditModal(false);
      setEditUser(null);
    } catch (err) {
      setEditError(err.response?.data?.message || "Loi khi cap nhat user");
      alert(err.response?.data?.message || "Lỗi khi cập nhật user!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Bạn có chắc muốn xóa user này không?")) return;

    try {
      setDeletingId(userId);
      setPageError("");
      await deleteUser(userId);

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setDeletingId(null);
    } catch (err) {
      setPageError(err.response?.data?.message || "Loi khi xoa user");
      setDeletingId(null);
      alert(err.response?.data?.message || "Lỗi khi xóa user!");
    }
  };

  const filteredUsers = users.filter((u) => {
    const keyword = search.toLowerCase();

    return (
      u.name.toLowerCase().includes(keyword) ||
      u.contactLines?.[0]?.toLowerCase().includes(keyword) ||
      u.roleValue?.toLowerCase().includes(keyword)
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  );

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const kpiCards = useMemo(
    () => [
      {
        label: "TOTAL MEMBERS",
        value: users.length.toLocaleString(),
        sub: "+12% vs last month",
        subIcon: "trending_up",
        subColor: "#4ade80",
        iconName: "groups",
        iconBg: "rgba(108,99,255,0.2)",
        iconColor: "#6c63ff",
      },
      {
        label: "ADMINS",
        value: users.filter((u) => u.roleValue === "admin").length,
        sub: "System managers",
        subIcon: "admin_panel_settings",
        subColor: "#f87171",
        iconName: "admin_panel_settings",
        iconBg: "rgba(239,68,68,0.15)",
        iconColor: "#f87171",
      },
      {
        label: "USERS",
        value: users.filter((u) => u.roleValue === "user").length,
        sub: "Normal accounts",
        subIcon: "person",
        subColor: "#60a5fa",
        iconName: "person",
        iconBg: "rgba(59,130,246,0.15)",
        iconColor: "#60a5fa",
      },
      {
        label: "PENDING APPROVAL",
        value: "07",
        sub: "Awaiting KYC",
        subIcon: "info",
        subColor: "#94a3b8",
        iconName: "hourglass_empty",
        iconBg: "rgba(245,158,11,0.2)",
        iconColor: "#fbbf24",
      },
    ],
    [users]
  );

  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          background: "#060e20",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
        rel="stylesheet"
      />

      <style>{`
        :root { --primary: #6c63ff; }
        * { box-sizing: border-box; }
        body { margin: 0; overflow-x: hidden; }
      `}</style>

      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          background: "#060e20",
          color: "#f1f5f9",
          fontFamily: "'Inter', sans-serif",
          overflowX: "hidden",
        }}
      >
        {showModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999,
            }}
          >
            <div
              style={{
                background: "#1e293b",
                padding: 24,
                borderRadius: 12,
                width: 340,
                boxShadow: "0 20px 70px rgba(0,0,0,0.45)",
              }}
            >
              <h3 style={{ margin: "0 0 16px", color: "#fff" }}>Add User</h3>

              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
              />

              <input
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
              />

              <input
                placeholder="Password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                style={inputStyle}
              />

              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                style={{ ...inputStyle, marginBottom: 16 }}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>

              {modalError && (
                <div
                  style={{
                    background: "rgba(248,113,113,0.12)",
                    border: "1px solid rgba(248,113,113,0.3)",
                    borderRadius: 8,
                    color: "#f87171",
                    fontSize: 12,
                    marginBottom: 12,
                    padding: "8px 10px",
                  }}
                >
                  {modalError}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleAddUser}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: 10,
                    background: "#6c63ff",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {submitting ? "Saving..." : "Save"}
                </button>

                <button
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: 10,
                    background: "rgba(255,255,255,0.06)",
                    color: "#cbd5e1",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && editUser && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999,
            }}
          >
            <div
              style={{
                background: "#1e293b",
                padding: 24,
                borderRadius: 12,
                width: 340,
                boxShadow: "0 20px 70px rgba(0,0,0,0.45)",
              }}
            >
              <h3 style={{ margin: "0 0 16px", color: "#fff" }}>
                Edit User
              </h3>

              <input
                placeholder="Name"
                value={editUser.name}
                onChange={(e) =>
                  setEditUser({ ...editUser, name: e.target.value })
                }
                style={inputStyle}
              />

              <input
                placeholder="Email"
                value={editUser.email}
                onChange={(e) =>
                  setEditUser({ ...editUser, email: e.target.value })
                }
                style={inputStyle}
              />

              <select
                value={editUser.roleValue}
                onChange={(e) =>
                  setEditUser({ ...editUser, roleValue: e.target.value })
                }
                style={{ ...inputStyle, marginBottom: 16 }}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>

              {editError && (
                <div
                  style={{
                    background: "rgba(248,113,113,0.12)",
                    border: "1px solid rgba(248,113,113,0.3)",
                    borderRadius: 8,
                    color: "#f87171",
                    fontSize: 12,
                    marginBottom: 12,
                    padding: "8px 10px",
                  }}
                >
                  {editError}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleEditUser}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: 10,
                    background: "#6c63ff",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {submitting ? "Saving..." : "Save"}
                </button>

                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditUser(null);
                  }}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: 10,
                    background: "rgba(255,255,255,0.06)",
                    color: "#cbd5e1",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <main
          style={{
            width: "100%",
            minHeight: "100vh",
          }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 16,
              marginBottom: 28,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: "#fff",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                User Management
              </h2>

              <p
                style={{
                  color: "#64748b",
                  fontSize: 14,
                  margin: "8px 0 0",
                }}
              >
                {formattedDate}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <button
                onClick={fetchUsers}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
              >
                <span className="material-icons-round" style={{ fontSize: 20 }}>
                  refresh
                </span>
              </button>

              <button
                onClick={() => {
                  setForm({
                    name: "",
                    email: "",
                    password: "123456",
                    role: "user",
                  });
                  setModalError("");
                  setShowModal(true);
                }}
                style={{
                  background: "#6c63ff",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "11px 22px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(108,99,255,0.4)",
                }}
              >
                <span className="material-icons-round" style={{ fontSize: 18 }}>
                  person_add
                </span>
                Add New User
              </button>
            </div>
          </header>

          {pageError && (
            <div
              style={{
                background: "rgba(248,113,113,0.12)",
                border: "1px solid rgba(248,113,113,0.3)",
                borderRadius: 12,
                color: "#f87171",
                fontSize: 13,
                marginBottom: 18,
                padding: "12px 16px",
              }}
            >
              {pageError}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {kpiCards.map((card) => (
              <div
                key={card.label}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "20px 22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  minWidth: 0,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: "#64748b",
                      margin: "0 0 8px",
                      textTransform: "uppercase",
                    }}
                  >
                    {card.label}
                  </p>

                  <h3
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: "#fff",
                      margin: "0 0 10px",
                      lineHeight: 1,
                    }}
                  >
                    {card.value}
                  </h3>

                  <p
                    style={{
                      fontSize: 11,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      margin: 0,
                      color: card.subColor,
                    }}
                  >
                    <span
                      className="material-icons-round"
                      style={{ fontSize: 14 }}
                    >
                      {card.subIcon}
                    </span>
                    {card.sub}
                  </p>
                </div>

                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: card.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    className="material-icons-round"
                    style={{ fontSize: 24, color: card.iconColor }}
                  >
                    {card.iconName}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                gap: 12,
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  position: "relative",
                  maxWidth: 420,
                  width: "100%",
                }}
              >
                <span
                  className="material-icons-round"
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#64748b",
                    fontSize: 18,
                  }}
                >
                  search
                </span>

                <input
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    padding: "10px 14px 10px 44px",
                    color: "#f1f5f9",
                    fontSize: 13,
                    outline: "none",
                  }}
                  placeholder="Search name, email or role..."
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  disabled
                  title="Advanced filters are not available yet"
                  style={{
                    padding: "9px 18px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#cbd5e1",
                    cursor: "not-allowed",
                    opacity: 0.55,
                  }}
                >
                  <span className="material-icons-round" style={{ fontSize: 16 }}>
                    filter_list
                  </span>
                  Filter
                </button>

                <button
                  type="button"
                  disabled
                  title="Export is not available yet"
                  style={{
                    padding: "9px 18px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#cbd5e1",
                    cursor: "not-allowed",
                    opacity: 0.55,
                  }}
                >
                  <span className="material-icons-round" style={{ fontSize: 16 }}>
                    file_download
                  </span>
                  Export
                </button>
              </div>
              <p style={{ width: "100%", margin: "2px 0 0", color: "#64748b", fontSize: 12 }}>
                Advanced filter and export are not available yet.
              </p>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: 950,
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                    {[
                      "Eminent Resident",
                      "Role",
                      "Contact Info",
                      "Status",
                      "Joined Date",
                      "Actions",
                    ].map((col, i) => (
                      <th
                        key={col}
                        style={{
                          padding: "13px 20px",
                          textAlign: i === 5 ? "right" : "left",
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#64748b",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: 30,
                          textAlign: "center",
                          color: "#64748b",
                        }}
                      >
                        Không tìm thấy user nào.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => (
                      <tr
                        key={user.id}
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.05)",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(255,255,255,0.03)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td style={{ padding: "16px 20px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: "50%",
                                background: user.avatarBg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: 13,
                                flexShrink: 0,
                              }}
                            >
                              {user.initials}
                            </div>

                            <div>
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: 14,
                                  color: "#f1f5f9",
                                }}
                              >
                                {user.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#64748b",
                                  marginTop: 2,
                                }}
                              >
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "16px 20px" }}>
                          <span
                            style={{
                              padding: "4px 12px",
                              borderRadius: 6,
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              background: user.role.bg,
                              color: user.role.color,
                              border: `1px solid ${user.role.border}`,
                            }}
                          >
                            {user.role.label}
                          </span>
                        </td>

                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ fontSize: 13, color: "#cbd5e1" }}>
                            {user.contactLines?.[0] ?? "—"}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#64748b",
                              marginTop: 2,
                            }}
                          >
                            {user.contactLines?.[1] ?? "—"}
                          </div>
                        </td>

                        <td style={{ padding: "16px 20px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: user.status.dot,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: user.status.color,
                              }}
                            >
                              {user.status.label}
                            </span>
                          </div>
                        </td>

                        <td
                          style={{
                            padding: "16px 20px",
                            fontSize: 13,
                            color: "#64748b",
                          }}
                        >
                          {user.joined}
                        </td>

                        <td
                          style={{
                            padding: "16px 20px",
                            textAlign: "right",
                          }}
                        >
                          <button
                            onClick={() => {
                              setEditError("");
                              setEditUser({
                                id: user.id,
                                name: user.name,
                                email: user.contactLines?.[0] ?? "",
                                roleValue: user.roleValue ?? "user",
                              });
                              setShowEditModal(true);
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#9fa7ff",
                              cursor: "pointer",
                              padding: 4,
                              borderRadius: 6,
                              display: "inline-flex",
                              marginRight: 4,
                            }}
                          >
                            <span
                              className="material-icons-round"
                              style={{ fontSize: 20 }}
                            >
                              edit
                            </span>
                          </button>

                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deletingId === user.id}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#f87171",
                              cursor: deletingId === user.id ? "not-allowed" : "pointer",
                              opacity: deletingId === user.id ? 0.5 : 1,
                              padding: 4,
                              borderRadius: 6,
                              display: "inline-flex",
                            }}
                          >
                            <span
                              className="material-icons-round"
                              style={{ fontSize: 20 }}
                            >
                              delete
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div
              style={{
                padding: "16px 20px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                Showing{" "}
                <strong style={{ color: "#f1f5f9" }}>
                  {filteredUsers.length === 0
                    ? 0
                    : Math.min(
                        (currentPage - 1) * ITEMS_PER_PAGE + 1,
                        filteredUsers.length
                      )}
                </strong>{" "}
                to{" "}
                <strong style={{ color: "#f1f5f9" }}>
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)}
                </strong>{" "}
                of{" "}
                <strong style={{ color: "#f1f5f9" }}>
                  {filteredUsers.length}
                </strong>{" "}
                users
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    opacity: currentPage === 1 ? 0.4 : 1,
                  }}
                >
                  <span className="material-icons-round" style={{ fontSize: 18 }}>
                    chevron_left
                  </span>
                </button>

                {getPageNumbers(currentPage, totalPages).map((n, i) =>
                  n === "..." ? (
                    <span
                      key={`ellipsis-${i}`}
                      style={{
                        width: 34,
                        height: 34,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        color: "#64748b",
                        userSelect: "none",
                      }}
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setCurrentPage(n)}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        border: "none",
                        background:
                          n === currentPage ? "#6c63ff" : "transparent",
                        color: n === currentPage ? "#fff" : "#64748b",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      {n}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor:
                      currentPage === totalPages ? "not-allowed" : "pointer",
                    opacity: currentPage === totalPages ? 0.4 : 1,
                  }}
                >
                  <span className="material-icons-round" style={{ fontSize: 18 }}>
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
