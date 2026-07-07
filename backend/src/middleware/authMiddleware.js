require("dotenv").config();
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;

// Middleware kiểm tra người dùng đã đăng nhập chưa
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({
      message: "Chưa đăng nhập hoặc thiếu token",
    });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(403).json({
      message: "Định dạng token không hợp lệ",
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, SECRET);

    // Lưu thông tin user vào req.user
    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({
      message: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
}

// Middleware kiểm tra quyền role
function checkRole(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        message: "Chưa xác thực người dùng",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập chức năng này",
      });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  checkRole,
};
