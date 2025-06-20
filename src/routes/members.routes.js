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
  getMemberAlerts,
  assignLockerToMember,
  removeLockerFromMember,
  assignPersonalTrainerToMember,
  removePersonalTrainerFromMember,
  getMembersWithLockers,
  getMembersWithPersonalTrainers,
} = require("../controllers/member.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const {
  validateMember,
  validateMembershipRenewal,
  validateLockerAssignment,
  validateTrainerAssignment,
} = require("../validations/member.validation");

const router = express.Router();

// Get all members
router.get("/", authenticate, getAllMembers);

// Search members
router.get("/search", authenticate, searchMembers);

// Get members with lockers
router.get("/lockers", authenticate, getMembersWithLockers);

// Get members with personal trainers
router.get("/personal-trainers", authenticate, getMembersWithPersonalTrainers);

// Get Member Alerts
router.get("/alerts", authenticate, getMemberAlerts);

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

// Locker assignment routes
router.post("/:memberId/assign-locker", authenticate, validateLockerAssignment, assignLockerToMember);
router.delete("/:memberId/remove-locker", authenticate, removeLockerFromMember);

// Personal trainer assignment routes
router.post("/:memberId/assign-trainer", authenticate, validateTrainerAssignment, assignPersonalTrainerToMember);
router.delete("/:memberId/remove-trainer", authenticate, removePersonalTrainerFromMember);

module.exports = router;
