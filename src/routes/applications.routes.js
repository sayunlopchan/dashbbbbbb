import { Router } from "express";
import {
  createApplication,
  getAllApplications,
  acceptApplication,
  deleteApplication,
  getApplicationById,
} from "../controllers/application.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateApplication } from "../validations/application.validation.js";

const router = Router();

// Get all applications (requires authentication)
router.get("/", authenticate, getAllApplications);

// Get application by id (requires authentication)
router.get("/:applicationId", authenticate, getApplicationById);

// Create a new application (no authentication required)
router.post("/", validateApplication, createApplication);

// Accept an application and create a member (requires authentication)
router.put("/accept/:applicationId", authenticate, acceptApplication);

// Delete an application (requires authentication)
router.delete("/delete/:applicationId", authenticate, deleteApplication);

export default router;
