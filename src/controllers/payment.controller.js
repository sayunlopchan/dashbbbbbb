import * as paymentService from "../services/payment.service.js";
import asyncHandler from "../utils/asyncHandler.js";

// Get all payments
export const getAllPayments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "paymentDate",
    sortOrder = "desc",
    search,
    startDate,
    endDate,
    method,
    type,
  } = req.query;

  const payments = await paymentService.getAllPaymentsService({
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy,
    sortOrder,
    search,
    startDate,
    endDate,
    method,
    type,
  });

  res.status(200).json({
    success: true,
    data: payments,
  });
});

// Create a new payment
export const createPayment = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  const paymentData = { ...req.body, memberId };

  const payment = await paymentService.createPaymentService(paymentData);

  res.status(201).json({
    success: true,
    data: payment,
  });
});

// Get all payments for a member
export const getMemberPayments = asyncHandler(async (req, res) => {
  const { memberId } = req.params;

  const payments = await paymentService.getMemberPaymentsService(memberId);

  res.status(200).json({
    success: true,
    data: payments,
  });
});

// Get revenue statistics
export const getRevenueStats = asyncHandler(async (req, res) => {
  const stats = await paymentService.getRevenueStatsService();

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// Get payment by ID
export const getPaymentById = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await paymentService.getPaymentByIdService(paymentId);

  res.status(200).json({
    success: true,
    data: payment,
  });
});

// Update payment status
export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { status } = req.body;

  const payment = await paymentService.updatePaymentStatusService(
    paymentId,
    status
  );

  res.status(200).json({
    success: true,
    data: payment,
  });
});

// Delete payment
export const deletePayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const result = await paymentService.deletePaymentService(paymentId);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});
