import { Routes, Route } from "react-router-dom";

import MainLayout from "./layout/MainLayout";

import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Orders from "./pages/Orders";
import Settings from "./pages/Settings";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import Rooms from "./pages/Rooms";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";


function App() {
  return (
    <Routes>

      {/* PUBLIC */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      {/* USER + ADMIN */}
      <Route
        path="/booking"
        element={
          <PrivateRoute>
            <Booking />
          </PrivateRoute>
        }
      />

      <Route
        path="/my-bookings"
        element={
          <PrivateRoute>
            <MyBookings />
          </PrivateRoute>
        }
      />

      {/* ADMIN */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute role="admin">
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/users"
        element={
          <PrivateRoute role="admin">
            <MainLayout>
              <Users />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/rooms"
        element={
          <PrivateRoute role="admin">
            <MainLayout>
              <Rooms />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/orders"
        element={
          <PrivateRoute role="admin">
            <MainLayout>
              <Orders />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <MainLayout>
              <Settings />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <MainLayout>
              <Settings />
            </MainLayout>
          </PrivateRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
