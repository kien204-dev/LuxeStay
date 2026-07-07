const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const pool = require("../db/db");

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error("JWT_SECRET chưa được cấu hình trong file .env");
}

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Vui lòng nhập email và mật khẩu",
      });
    }

    const result = await pool.query(
      `SELECT id,name,email,password,role
       FROM users
       WHERE email=$1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      SECRET,
      {
        expiresIn: "1d",
      }
    );

    const { password: _, ...safeUser } = user;

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: safeUser,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Lỗi server",
    });

  }
});

// ================= REGISTER =================
router.post("/register", async (req, res) => {

  try {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {

      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin",
      });

    }

    const check = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    );

    if (check.rows.length > 0) {

      return res.status(400).json({
        message: "Email đã tồn tại",
      });

    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users(name,email,password,role)
       VALUES($1,$2,$3,'user')
       RETURNING id,name,email,role`,
      [
        name,
        email,
        hashedPassword,
      ]
    );

    res.status(201).json({
      message: "Đăng ký thành công",
      user: result.rows[0],
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Lỗi server",
    });

  }

});

// ================= GOOGLE LOGIN =================
router.post("/google-login", async (req, res) => {

  try {

    const { name, email } = req.body;

    if (!email) {

      return res.status(400).json({
        message: "Email không hợp lệ",
      });

    }

    let result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    let user;

    if (result.rows.length === 0) {

      const randomPassword = Math.random().toString(36);

      const hashed = await bcrypt.hash(randomPassword, 10);

      result = await pool.query(
        `INSERT INTO users(name,email,password,role)
         VALUES($1,$2,$3,'user')
         RETURNING id,name,email,role`,
        [
          name,
          email,
          hashed,
        ]
      );

      user = result.rows[0];

    } else {

      user = result.rows[0];

    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.json({
      message: "Google Login thành công",
      token,
      user,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Lỗi server",
    });

  }

});

module.exports = router;
