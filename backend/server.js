require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { AUTH_COOKIE_NAME } = require("./src/services/authSession");
const { globalErrorHandler } = require("./src/middleware/errorHandler");

require("./src/db/db");

const app = express();

const PORT = process.env.PORT || 3001;
const allowedOrigins = new Set(
  [
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    process.env.NODE_ENV !== "production" ? "http://localhost:5173" : null,
  ]
    .filter(Boolean)
    .map((origin) => origin.replace(/\/$/, ""))
);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, "");

    if (
      allowedOrigins.has(normalizedOrigin)
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
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS) || 1);
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  const unsafeMethod = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  const usesAuthCookie = String(req.headers.cookie || "")
    .split(";")
    .some((item) => item.trim().startsWith(`${AUTH_COOKIE_NAME}=`));
  const origin = req.headers.origin?.replace(/\/$/, "");

  if (unsafeMethod && usesAuthCookie && origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ message: "Request origin is not allowed" });
  }

  return next();
});
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

app.use(globalErrorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
