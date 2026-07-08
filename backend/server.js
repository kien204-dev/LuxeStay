require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

require("./src/db/db");

const app = express();

const PORT = process.env.PORT || 3001;
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  "http://localhost:5173",
].filter(Boolean);

const userRoutes = require("./src/routes/userRoutes");
const authRoutes = require("./src/routes/auth");
const bookingRoutes = require("./src/routes/bookings");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const roomRoutes = require("./src/routes/roomRoutes");

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Test API
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Routes
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/rooms", roomRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({
    message: "API không tồn tại",
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
