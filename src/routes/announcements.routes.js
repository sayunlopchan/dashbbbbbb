import express from "express";
import * as announcementController from "../controllers/announcement.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

// GET all announcements - authenticated
router.get("/", authenticate, announcementController.getAllAnnouncements);

// GET a single announcement by ID - authenticated
router.get(
  "/:announcementId",
  authenticate,
  announcementController.getAnnouncementById
);

// CREATE a new announcement - authenticated
router.post("/", authenticate, announcementController.createAnnouncement);

// UPDATE an announcement - authenticated
router.put(
  "/:announcementId",
  authenticate,
  announcementController.updateAnnouncement
);

// DELETE an announcement - authenticated
router.delete(
  "/:announcementId",
  authenticate,
  announcementController.deleteAnnouncement
);

export default router;
