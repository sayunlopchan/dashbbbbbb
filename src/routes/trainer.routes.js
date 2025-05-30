const express = require("express");
const {
  createTrainer,
  getAllTrainers,
  getTrainerById,
  updateTrainer,
  deleteTrainer,
} = require("../controllers/trainer.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authenticate, createTrainer);
router.get("/", authenticate, getAllTrainers);
router.get("/:trainerId", authenticate, getTrainerById);
router.put("/:trainerId", authenticate, updateTrainer);
router.delete("/:trainerId", authenticate, deleteTrainer);

module.exports = router;
