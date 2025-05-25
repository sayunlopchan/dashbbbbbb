import express from "express";
import {
  createMember,
  updateMember,
  deleteMember,
  getAllMembers,
  getMemberById,
  getMemberPaymentHistory,
  renewMembership,
  cancelMembership,
  searchMembers,
} from "../controllers/member.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  validateMember,
  validateMembershipRenewal,
} from "../validations/member.validation.js";

const router = express.Router();

// Get all members
router.get("/", authenticate, getAllMembers);

// Search members
router.get("/search", authenticate, searchMembers);

// new member
router.post("/", authenticate, validateMember, createMember);

// Get member
router.get("/:memberId", authenticate, getMemberById);

// Update member
router.put("/:memberId", authenticate, validateMember, updateMember);

// Delete member
router.delete("/:memberId", authenticate, deleteMember);

// Payment routes
router.get("/:memberId/payment-history", authenticate, getMemberPaymentHistory);

// Membership Renewal
router.post(
  "/:memberId/renew",
  authenticate,
  validateMembershipRenewal,
  renewMembership
);

// Cancel Membership
router.post("/:memberId/cancel", authenticate, cancelMembership);

export default router;
