const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  register,
  login,
  logout,
  verifyToken,
} = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

// Rate limiter for login route
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts. Please try again in 15 minutes.",
});

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.post("/logout", authenticate, logout);
router.get("/verify", authenticate, verifyToken);

module.exports = router;
