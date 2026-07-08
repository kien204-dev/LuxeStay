const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const pool = require("../db/db");
const {
  assertEmailConfigured,
  sendPasswordResetEmail,
} = require("../services/emailService");

const SECRET = process.env.JWT_SECRET;
const RESET_RESPONSE_MESSAGE =
  "If this email exists, a password reset link has been sent.";

const PUBLIC_USER_FIELDS =
  "id,name,email,role,phone,bio,avatar_url,created_at,updated_at";

if (!SECRET) {
  throw new Error("JWT_SECRET chưa được cấu hình trong file .env");
}

function getResetTokenTtlMinutes() {
  const ttl = Number(process.env.RESET_TOKEN_TTL_MINUTES || 15);
  return Number.isFinite(ttl) && ttl > 0 ? ttl : 15;
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
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
      `SELECT ${PUBLIC_USER_FIELDS},password
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
       RETURNING ${PUBLIC_USER_FIELDS}`,
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

// ================= FORGOT PASSWORD =================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    try {
      assertEmailConfigured();
    } catch (configError) {
      return res.status(500).json({
        message: configError.message,
      });
    }

    const userResult = await pool.query(
      "SELECT id, name, email FROM users WHERE email=$1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.json({
        message: RESET_RESPONSE_MESSAGE,
      });
    }

    const user = userResult.rows[0];
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + getResetTokenTtlMinutes() * 60 * 1000);

    await pool.query(
      `INSERT INTO password_reset_tokens(user_id, token_hash, expires_at)
       VALUES($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl.replace(/\/$/, "")}/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });

    res.json({
      message: RESET_RESPONSE_MESSAGE,
    });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({
      message: "Unable to send password reset email",
    });
  }
});

// ================= RESET PASSWORD =================
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      message: "Token and password are required",
    });
  }

  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const tokenHash = hashResetToken(token);
    const tokenResult = await client.query(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token_hash = $1
       AND used_at IS NULL
       AND expires_at > NOW()
       ORDER BY id DESC
       LIMIT 1
       FOR UPDATE`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Reset token is invalid or expired",
      });
    }

    const resetToken = tokenResult.rows[0];
    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query(
      "UPDATE users SET password=$1 WHERE id=$2",
      [hashedPassword, resetToken.user_id]
    );

    await client.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE id=$1",
      [resetToken.id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Password reset successfully",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({
      message: "Unable to reset password",
    });
  } finally {
    client.release();
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
      `SELECT ${PUBLIC_USER_FIELDS}
       FROM users
       WHERE email=$1`,
      [email]
    );

    let user;

    if (result.rows.length === 0) {

      const randomPassword = Math.random().toString(36);

      const hashed = await bcrypt.hash(randomPassword, 10);

      result = await pool.query(
        `INSERT INTO users(name,email,password,role)
         VALUES($1,$2,$3,'user')
         RETURNING ${PUBLIC_USER_FIELDS}`,
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
