const express = require("express");
const {
  checkIn,
  checkOut,
  getMemberAttendance,
  getAllAttendance,
  deleteAttendance,
} = require("../controllers/attendance.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

// Check-in member
router.post("/check-in/:memberId", authenticate, checkIn);

// Check-out member
router.post("/check-out/:memberId", authenticate, checkOut);

// Get member's attendance history
router.get("/member/:memberId", authenticate, getMemberAttendance);

// Get all attendance records
router.get("/", authenticate, getAllAttendance);

// Delete member's attendance records
router.delete("/member/:memberId", authenticate, deleteAttendance);

module.exports = router;
