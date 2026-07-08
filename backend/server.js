require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

require("./src/db/db");

const app = express();

const PORT = process.env.PORT || 3001;
const allowedOrigins = new Set(
  [
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    "http://localhost:5173",
  ]
    .filter(Boolean)
    .map((origin) => origin.replace(/\/$/, ""))
);

function isAllowedVercelOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return hostname === "vercel.app" || hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, "");

    if (
      allowedOrigins.has(normalizedOrigin) ||
      isAllowedVercelOrigin(normalizedOrigin)
    ) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 204,
};

const userRoutes = require("./src/routes/userRoutes");
const authRoutes = require("./src/routes/auth");
const bookingRoutes = require("./src/routes/bookings");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const roomRoutes = require("./src/routes/roomRoutes");

app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/rooms", roomRoutes);

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
