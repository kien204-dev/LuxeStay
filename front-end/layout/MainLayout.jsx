import { useEffect, useState } from "react";
import Sidebar from "../layout/components/Sidebar";
import { useAuth } from "../context/AuthContext";

function MainLayout({ children }) {
  const { user } = useAuth();
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const handleResize = () => setCompact(window.innerWidth < 900);
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: compact ? "column" : "row",
        minHeight: "100vh",
        width: "100%",
        background: "#060e20",
        color: "#dee5ff",
      }}
    >
      <Sidebar compact={compact} />

      <main
        style={{
          marginLeft: compact ? 0 : 240,
          width: compact ? "100%" : "calc(100% - 240px)",
          minHeight: "100vh",
          background: "#060e20",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            minHeight: 70,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            padding: compact ? "0 18px" : "0 36px",
            borderBottom: "1px solid #2b3658",
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ margin: 0, fontSize: compact ? 18 : 24 }}>
            Xin chao, {user?.name}
          </h2>
          <span>{user?.role}</span>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: 1280,
            margin: "0 auto",
            padding: compact ? "22px 16px" : "32px 36px",
            boxSizing: "border-box",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
