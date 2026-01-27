const rateLimit = require("express-rate-limit");

// 🔐 Login Rate Limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  message: {
    success: false,
    message: "Too many login attempts. Try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 📱 OTP Rate Limiter
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Too many OTP requests. Please wait",
  },
});

module.exports = {
  loginLimiter,
  otpLimiter
};
