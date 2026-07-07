const pool = require("../db/db.js");
const bcrypt = require("bcryptjs");

const ALLOWED_ROLES = ["admin", "user"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{8,20}$/;

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateEmail(email) {
  return EMAIL_PATTERN.test(email);
}

function validatePassword(password, required = true) {
  if (!password) return !required;
  return typeof password === "string" && password.length >= 6;
}

function validatePhone(phone) {
  if (!phone) return true;
  return typeof phone === "string" && PHONE_PATTERN.test(phone.trim());
}

function validateRole(role) {
  return ALLOWED_ROLES.includes(role);
}

function parsePositiveInteger(value) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
}

function isForeignKeyError(err) {
  return err?.code === "23503";
}

// ======================
// GET ALL USERS
// ======================
exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM users
       ORDER BY id ASC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================
// GET USER BY ID
// ======================
exports.getUserById = async (req, res) => {
  try {
    const id = parsePositiveInteger(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "User id is invalid",
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, role
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================
// CREATE USER
// ======================
exports.createUser = async (req, res) => {
  try {
    const name = normalizeString(req.body.name);
    const email = normalizeString(req.body.email).toLowerCase();
    const password = req.body.password;
    const role = normalizeString(req.body.role) || "user";
    const phone = normalizeString(req.body.phone);

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email và password là bắt buộc",
      });
    }

    // Kiểm tra email tồn tại
    if (!validateEmail(email)) {
      return res.status(400).json({
        message: "Email is invalid",
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({
        message: "Phone is invalid",
      });
    }

    if (!validateRole(role)) {
      return res.status(400).json({
        message: "Role must be admin or user",
      });
    }

    const checkEmail = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (checkEmail.rows.length > 0) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users(name,email,password,role)
       VALUES($1,$2,$3,$4)
       RETURNING id,name,email,role`,
      [
        name,
        email,
        hashedPassword,
        role
      ]
    );

    res.status(201).json({
      message: "User created successfully",
      user: result.rows[0],
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================
// UPDATE USER
// ======================
exports.updateUser = async (req, res) => {
  try {

    const id = parsePositiveInteger(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "User id is invalid",
      });
    }

    const name = normalizeString(req.body.name);
    const email = normalizeString(req.body.email).toLowerCase();
    const role = normalizeString(req.body.role) || "user";
    const password = req.body.password;
    const phone = normalizeString(req.body.phone);

    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        message: "Email is invalid",
      });
    }

    if (!validatePassword(password, false)) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({
        message: "Phone is invalid",
      });
    }

    if (!validateRole(role)) {
      return res.status(400).json({
        message: "Role must be admin or user",
      });
    }

    const duplicateEmail = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email, id]
    );

    if (duplicateEmail.rows.length > 0) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    let query;
    let values;

    if (password) {

      const hashedPassword = await bcrypt.hash(password,10);

      query = `
      UPDATE users
      SET
      name=$1,
      email=$2,
      role=$3,
      password=$4
      WHERE id=$5
      RETURNING id,name,email,role
      `;

      values = [
        name,
        email,
        role,
        hashedPassword,
        id
      ];

    } else {

      query = `
      UPDATE users
      SET
      name=$1,
      email=$2,
      role=$3
      WHERE id=$4
      RETURNING id,name,email,role
      `;

      values = [
        name,
        email,
        role,
        id
      ];

    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {

      return res.status(404).json({
        message: "User not found",
      });

    }

    res.json({
      message: "User updated successfully",
      user: result.rows[0],
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });

  }
};

// ======================
// DELETE USER
// ======================
exports.deleteUser = async (req, res) => {

  try {

    const id = parsePositiveInteger(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "User id is invalid",
      });
    }

    const result = await pool.query(
      "DELETE FROM users WHERE id=$1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {

      return res.status(404).json({
        message: "User not found",
      });

    }

    res.json({
      message: "User deleted successfully",
    });

  } catch (err) {
    if (isForeignKeyError(err)) {
      return res.status(400).json({
        message: "Cannot delete user because related records exist",
      });
    }

    console.error(err);

    res.status(500).json({
      message: "Server error",
    });

  }

};
