import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#060e20",
        color: "#fff",
      }}>
        Loading...
      </div>
    );
  }

  // Chưa login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Không đúng role
  if (role && user.role !== role) {
    return <Navigate to="/booking" replace />;
  }

  return children;
}

export default PrivateRoute;