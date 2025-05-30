const express = require("express");
const {
  register,
  login,
  logout,
  verifyToken,
} = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authenticate, logout);
router.get("/verify", authenticate, verifyToken);

module.exports = router;
