const express = require("express");
const {
  createMembership,
  getAllMemberships,
  getMembershipById,
  updateMembership,
  deleteMembership,
} = require("../controllers/membership.controller");
const { protectRoute } = require("../middlewares/protect.middleware");

const router = express.Router();

// Apply protection to all membership routes
router.use(protectRoute);

// Create Membership
router.post("/", createMembership);

// Get All Memberships
router.get("/", getAllMemberships);

// Get Membership by ID
router.get("/:id", getMembershipById);

// Update Membership
router.put("/:id", updateMembership);

// Delete Membership
router.delete("/:id", deleteMembership);

module.exports = router;
