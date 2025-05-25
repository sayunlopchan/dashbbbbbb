import express from "express";
import {
  createMembership,
  getAllMemberships,
  getMembershipById,
  updateMembership,
  deleteMembership,
} from "../controllers/membership.controller.js";
import { protectRoute } from "../middlewares/protect.middleware.js";

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

export default router;
