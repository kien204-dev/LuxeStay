const nodemailer = require("nodemailer");

function getSmtpConfig() {
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
  };
}

function assertEmailConfigured() {
  const config = getSmtpConfig();
  const missing = [];

  if (!config.host) missing.push("SMTP_HOST");
  if (!process.env.SMTP_PORT) missing.push("SMTP_PORT");
  if (!config.user) missing.push("SMTP_USER");
  if (!config.pass) missing.push("SMTP_PASS (or SMTP_PASSWORD)");
  if (!config.from) missing.push("SMTP_FROM");

  if (missing.length > 0) {
    throw new Error(`SMTP is not configured. Missing: ${missing.join(", ")}`);
  }

  return config;
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const config = assertEmailConfigured();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    // Render does not provide reliable outbound IPv6 connectivity. Gmail can
    // resolve to an IPv6 address first, which otherwise fails with ENETUNREACH.
    family: 4,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transporter.sendMail({
    from: config.from,
    to,
    subject: "Reset your LuxeStay password",
    text: [
      `Hello ${name || "there"},`,
      "",
      "We received a request to reset your LuxeStay password.",
      `Open this link to reset your password: ${resetUrl}`,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <p>Hello ${name || "there"},</p>
      <p>We received a request to reset your LuxeStay password.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });
}

module.exports = {
  assertEmailConfigured,
  sendPasswordResetEmail,
};
