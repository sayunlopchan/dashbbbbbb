const express = require("express");
const {
  createPayment,
  getMemberPayments,
  getRevenueStats,
  getPaymentById,
  updatePaymentStatus,
  getAllPayments,
  deletePayment,
} = require("../controllers/payment.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

// Get all payments
router.get("/", authenticate, getAllPayments);

// Create a new payment
router.post("/member/:memberId", authenticate, createPayment);

// Get all payments for a member
router.get("/member/:memberId", authenticate, getMemberPayments);

// Get revenue statistics
router.get("/stats", authenticate, getRevenueStats);

// Get payment by ID
router.get("/:paymentId", authenticate, getPaymentById);

// Update payment status
router.patch("/:paymentId/status", authenticate, updatePaymentStatus);

// Delete payment
router.delete("/:paymentId", authenticate, deletePayment);

module.exports = router;
