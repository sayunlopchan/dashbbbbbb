import { Router } from "express";
import {
  getAllApplicationHistory,
  getApplicationHistoryById,
  deleteApplicationHistory,
} from "../controllers/applicationHistory.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Get all application history (requires authentication)
router.get("/", authenticate, getAllApplicationHistory);

// Get application history by id (requires authentication)
router.get("/:applicationId", authenticate, getApplicationHistoryById);

// Delete application history (requires authentication)
router.delete("/:applicationId", authenticate, deleteApplicationHistory);

export default router;
