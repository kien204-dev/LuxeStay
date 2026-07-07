import { useNavigate, useLocation } from "react-router-dom";
import Icon from "../../utils/icon";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar({ compact = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "Dashboard" },
    { path: "/booking", label: "Bookings", icon: "Booking" },
    { path: "/rooms", label: "Rooms", icon: "Rooms" },
    { path: "/users", label: "Users", icon: "Users" },
    { path: "/orders", label: "Orders", icon: "Orders" },
    { path: "/settings", label: "Settings", icon: "Settings" },
  ];

  return (
    <aside
      style={{
        width: compact ? "100%" : 240,
        position: compact ? "sticky" : "fixed",
        top: 0,
        left: 0,
        height: compact ? "auto" : "100vh",
        background: "rgba(10,18,38,0.92)",
        backdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(64,72,93,0.35)",
        display: "flex",
        flexDirection: compact ? "row" : "column",
        padding: compact ? "12px" : "24px 16px",
        zIndex: 100,
        boxSizing: "border-box",
        gap: compact ? 12 : 0,
        overflowX: compact ? "auto" : "visible",
      }}
    >
      <div
        onClick={() => navigate("/dashboard")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: compact ? "0 8px" : "0 8px 28px",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "#9fa7ff" }}>
          <Icon.Hotel />
        </span>
        <span style={{ fontSize: 20, fontWeight: 800, color: "#9fa7ff" }}>
          LuxeStay
        </span>
      </div>

      <nav
        style={{
          flex: compact ? "0 0 auto" : 1,
          display: "flex",
          flexDirection: compact ? "row" : "column",
          gap: 6,
        }}
      >
        {navItems.map(({ path, label, icon }) => {
          const IconComp = Icon[icon];
          const active = location.pathname.startsWith(path);

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: compact ? "9px 12px" : "11px 14px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                background: active
                  ? "rgba(159,167,255,0.14)"
                  : "transparent",
                color: active ? "#9fa7ff" : "#7b849e",
                fontWeight: active ? 700 : 500,
                borderLeft: active
                  ? "2px solid #9fa7ff"
                  : "2px solid transparent",
                textAlign: "left",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {IconComp ? <IconComp /> : <span>•</span>}
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <button
        onClick={() => {
          logout();
          navigate("/login");
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: compact ? "9px 12px" : "11px 14px",
          borderRadius: 10,
          background: "transparent",
          color: "#f87171",
          cursor: "pointer",
          border: "none",
          fontWeight: 600,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        <Icon.Logout />
        <span>Logout</span>
      </button>
    </aside>
  );
}
