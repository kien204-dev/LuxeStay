require("dotenv").config();

const { Pool } = require("pg");

const isNeon =
  process.env.DB_HOST &&
  process.env.DB_HOST.includes("neon.tech");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5433,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: isNeon ? { rejectUnauthorized: false } : false,
});

pool
  .connect()
  .then(() => console.log("PostgreSQL connected"))
  .catch((err) =>
    console.error("PostgreSQL connection failed:", err.message)
  );

module.exports = pool;
