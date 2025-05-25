import express from "express";
import {
  createTrainer,
  getAllTrainers,
  getTrainerById,
  updateTrainer,
  deleteTrainer,
} from "../controllers/trainer.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, createTrainer);
router.get("/", authenticate, getAllTrainers);
router.get("/:trainerId", authenticate, getTrainerById);
router.put("/:trainerId", authenticate, updateTrainer);
router.delete("/:trainerId", authenticate, deleteTrainer);

export default router;
