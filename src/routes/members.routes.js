const express = require("express");
const {
  createMember,
  updateMember,
  deleteMember,
  getAllMembers,
  getMemberById,
  getMemberPaymentHistory,
  renewMembership,
  cancelMembership,
  searchMembers,
} = require("../controllers/member.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const {
  validateMember,
  validateMembershipRenewal,
} = require("../validations/member.validation");

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

module.exports = router;
