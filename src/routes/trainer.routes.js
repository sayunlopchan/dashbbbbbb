const express = require("express");
const {
  createTrainer,
  getAllTrainers,
  getTrainerById,
  updateTrainer,
  deleteTrainer,
  assignMemberToTrainer,
  removeMemberFromTrainer,
  getTrainerWithMembers,
  getAllTrainersWithMembers,
  updateMemberStatusInTrainer,
} = require("../controllers/trainer.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const {
  validateTrainer,
  validateMemberAssignment,
  validateMemberStatusUpdate,
} = require("../validations/trainer.validation");

const router = express.Router();

// Basic trainer CRUD operations
router.post("/", authenticate, validateTrainer, createTrainer);
router.get("/", authenticate, getAllTrainers);
router.get("/:trainerId", authenticate, getTrainerById);
router.put("/:trainerId", authenticate, validateTrainer, updateTrainer);
router.delete("/:trainerId", authenticate, deleteTrainer);

// Get all trainers with their assigned members
router.get("/members/all", authenticate, getAllTrainersWithMembers);

// Get specific trainer with assigned members
router.get("/:trainerId/members", authenticate, getTrainerWithMembers);

// Assign member to trainer
router.post("/:trainerId/assign-member", authenticate, validateMemberAssignment, assignMemberToTrainer);

// Remove member from trainer
router.delete("/:trainerId/members/:memberId", authenticate, removeMemberFromTrainer);

// Update member status in trainer
router.patch("/:trainerId/members/:memberId/status", authenticate, validateMemberStatusUpdate, updateMemberStatusInTrainer);

module.exports = router;
