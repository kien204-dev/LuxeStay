const { rateLimit } = require("express-rate-limit");

const commonOptions = {
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: { message: "Too many requests. Please try again later." },
};

const loginRateLimit = rateLimit({
  ...commonOptions,
  windowMs: 60 * 1000,
  limit: 10,
});

const forgotPasswordRateLimit = rateLimit({
  ...commonOptions,
  windowMs: 60 * 60 * 1000,
  limit: 5,
});

const resetPasswordRateLimit = rateLimit({
  ...commonOptions,
  windowMs: 60 * 60 * 1000,
  limit: 10,
});

module.exports = {
  forgotPasswordRateLimit,
  loginRateLimit,
  resetPasswordRateLimit,
};
