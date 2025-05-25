import express from "express";
import {
  checkIn,
  checkOut,
  getMemberAttendance,
  getAllAttendance,
  deleteAttendance,
} from "../controllers/attendance.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

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

export default router;
